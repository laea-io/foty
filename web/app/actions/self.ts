'use server'

import { db } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth'
import { notify } from '@/lib/server/domain/notify'
import { FlowError } from '@/lib/server/domain/types'

/** 데스크톱에서 "내 휴대폰으로 링크 보내기" — 같은 계정 알림으로 체크인 화면 링크를 보낸다 */
export async function sendCheckinLinkAction(themeId: string): Promise<{ ok: boolean }> {
  const v = await requireViewer(`/trips/${themeId}/checkin`)
  const id = String(themeId).slice(0, 80)
  await notify(db, [v.id], {
    title: '체크인 화면 링크예요',
    body: '현장에서 이 알림을 눌러 체크인 화면을 열어 주세요.',
    href: `/trips/${id}/checkin`,
  })
  return { ok: true }
}

/** 참여자의 주요 변경 제안(날짜 · 집결 시간 · 집결 장소 · 예산) — 그룹 모두가 확인하면 반영 */
export async function proposeChangeAction(
  _: { error?: string; done?: boolean } | undefined,
  f: FormData,
): Promise<{ error?: string; done?: boolean } | undefined> {
  const { act } = await import('@/lib/server/act')
  const { confirmChange, propose } = await import('@/lib/server/domain/changes')
  const { loadTheme } = await import('@/lib/server/domain/read')
  const { revalidatePath } = await import('next/cache')
  const themeId = String(f.get('theme') ?? '')
  const v = await requireViewer(`/trips/${themeId}/propose`)
  const kind = String(f.get('kind') ?? '')
  const to = String(f.get('to') ?? '').trim()
  const r = await act(async () => {
    const t = await loadTheme(db, themeId)
    if (!t) throw new FlowError('input', '테마를 찾을 수 없어요')
    if (t.status === '취소' || t.status === '여행 완료') throw new FlowError('input', '이미 끝난 테마예요')
    let c: { id: string }
    if (kind === 'date') {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to) || to <= today)
        throw new FlowError('input', '내일 이후 날짜를 골라 주세요')
      c = await propose(db, {
        themeId,
        userId: v.id,
        kind: 'date',
        label: '날짜',
        from: t.day,
        to,
        payload: { day: to },
      })
    } else if (kind === 'budget') {
      const won = Number(to.replace(/[^\d]/g, ''))
      if (!won && won !== 0) throw new FlowError('input', '예산을 숫자로 적어 주세요')
      c = await propose(db, {
        themeId,
        userId: v.id,
        kind: 'budget',
        label: '예산',
        from: t.cost,
        to: `${won.toLocaleString('ko-KR')}원`,
        payload: { costWon: won },
      })
    } else if (kind === 'meet_time' || kind === 'meet_place') {
      if (!to) throw new FlowError('input', '바꿀 내용을 적어 주세요')
      c = await propose(db, {
        themeId,
        userId: v.id,
        kind,
        label: kind === 'meet_time' ? '집결 시간' : '집결 장소',
        from: t.meetDetail || '아직 정하지 않음',
        to: to.slice(0, 80),
        payload: { meet: to.slice(0, 120) },
      })
    } else throw new FlowError('input', '바꿀 항목을 골라 주세요')
    // 제안한 사람은 바로 확인한 것으로
    await confirmChange(db, { changeId: c.id, userId: v.id })
  })
  if (!r.ok) return { error: r.error }
  revalidatePath(`/trips/${themeId}`)
  return { done: true }
}
