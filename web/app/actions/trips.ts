'use server'

// 여행 서버 액션 — 변경 확인·제안, 대화, AI 제안, 체크인, 평가, 차단
import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ChatMsg } from '@/components/trips/types'
import { db, schema as s } from '@/lib/db'
import { env } from '@/lib/env'
import { requireViewer } from '@/lib/server/auth/session'
import { confirmChange, propose } from '@/lib/server/domain/changes'
import { checkin } from '@/lib/server/domain/flow'
import { notify } from '@/lib/server/domain/notify'
import {
  askHostCheckin,
  blockUser,
  proposeAiStop,
  sendChat,
  submitPeerReviews,
  tellAttended,
} from '@/lib/server/domain/trips'
import { FlowError } from '@/lib/server/domain/types'
import { loadTheme } from '@/lib/server/queries/theme-view'
import { toChat } from '@/lib/server/queries/trips'
import { act } from '@/lib/server/util/act'
import type { FormState } from '@/lib/server/util/form'
import { rules } from '@/lib/server/util/rules'

const themeId = z.string().min(1).max(80)

/** 변경 확인 카드의 “확인했어요” */
export async function confirmChangeAction(_: FormState, form: FormData): Promise<FormState> {
  const p = z.object({ themeId, changeId: z.string().uuid() }).safeParse(Object.fromEntries(form))
  if (!p.success) return { error: '변경을 찾을 수 없어요' }
  const viewer = await requireViewer(`/trips/${p.data.themeId}`)
  const r = await act(() => confirmChange(db, { changeId: p.data.changeId, userId: viewer.id }))
  if (!r.ok) return { error: r.error }
  revalidatePath(`/trips/${p.data.themeId}`, 'layout')
  return { ok: true }
}

/** 그룹 대화 보내기 — 넣은 글을 그대로 돌려준다(화면에 바로 붙인다) */
export async function sendChatAction(input: { themeId: string; body: string }) {
  const id = themeId.parse(input.themeId)
  const viewer = await requireViewer(`/trips/${id}/chat`)
  return act<ChatMsg>(async () => {
    const row = await sendChat(db, { themeId: id, userId: viewer.id, body: String(input.body ?? '') })
    return toChat(row, viewer.name, viewer.id)
  })
}

/** AI 도우미 결과의 “코스에 제안” */
export async function proposeAiAction(input: { themeId: string; placeId: string }) {
  const id = themeId.parse(input.themeId)
  const placeId = z.string().min(1).max(80).parse(input.placeId)
  const viewer = await requireViewer(`/trips/${id}/ai`)
  const r = await act(async () => {
    await proposeAiStop(db, { themeId: id, userId: viewer.id, placeId })
  })
  if (r.ok) revalidatePath(`/trips/${id}`, 'layout')
  return r
}

/** 시연(DEMO_MODE=1): QR 없이 체크인 — /c/<토큰>과 같은 동작 */
export async function demoCheckinAction(_: FormState, form: FormData): Promise<FormState> {
  const id = themeId.safeParse(form.get('themeId'))
  if (!id.success) return { error: '테마를 찾을 수 없어요' }
  if (env.DEMO_MODE !== '1') return { error: '시연 모드에서만 쓸 수 있어요' }
  const viewer = await requireViewer(`/trips/${id.data}/checkin`)
  const r = await act(() => checkin(db, { themeId: id.data, userId: viewer.id, anyDay: true }))
  if (!r.ok) return { error: r.error }
  revalidatePath(`/trips/${id.data}`, 'layout')
  redirect(`/trips/${id.data}/checkin/done`)
}

/** “QR이 안 돼요” — 호스트에게 확인 요청 */
export async function askHostAction(_: FormState, form: FormData): Promise<FormState> {
  const id = themeId.safeParse(form.get('themeId'))
  if (!id.success) return { error: '테마를 찾을 수 없어요' }
  const viewer = await requireViewer(`/trips/${id.data}/checkin`)
  const r = await act(() => askHostCheckin(db, { themeId: id.data, userId: viewer.id }))
  return r.ok ? { ok: true } : { error: r.error }
}

/** 지난 여행 · 검토 중: “참여했다고 알리기” */
export async function tellAttendedAction(_: FormState, form: FormData): Promise<FormState> {
  const id = themeId.safeParse(form.get('themeId'))
  if (!id.success) return { error: '테마를 찾을 수 없어요' }
  const viewer = await requireViewer('/trips/past')
  const r = await act(() => tellAttended(db, { themeId: id.data, userId: viewer.id }))
  if (!r.ok) return { error: r.error }
  revalidatePath('/trips/past')
  return { ok: true }
}

/** 참여자 더보기 · 차단하기 */
export async function blockAction(_: FormState, form: FormData): Promise<FormState> {
  const p = z.object({ themeId, handle: z.string().min(1).max(60) }).safeParse(Object.fromEntries(form))
  if (!p.success) return { error: '사람을 찾을 수 없어요' }
  const viewer = await requireViewer(`/trips/${p.data.themeId}/members`)
  const [u] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.handle, p.data.handle))
  if (!u) return { error: '사람을 찾을 수 없어요' }
  const r = await act(() => blockUser(db, { userId: viewer.id, blockedId: u.id }))
  return r.ok ? { ok: true } : { error: r.error }
}

/** 평가 보내기 — 사람별 행동 태그(tag:<handle> = 태그) + 첫 방문 */
export async function reviewAction(_: FormState, form: FormData): Promise<FormState> {
  const id = themeId.safeParse(form.get('themeId'))
  if (!id.success) return { error: '테마를 찾을 수 없어요' }
  const viewer = await requireViewer(`/trips/${id.data}/review`)
  const handles = form.getAll('person').map(String).slice(0, 12)
  const users = handles.length
    ? await db
        .select({ id: s.users.id, handle: s.users.handle })
        .from(s.users)
        .where(inArray(s.users.handle, handles))
    : []
  const reviews = users.map((u) => ({
    toUser: u.id,
    tags: form
      .getAll(`tag:${u.handle}`)
      .map(String)
      .filter((x) => rules.behaviorTags.includes(x)),
  }))
  const fv = form.get('firstVisit')
  const firstVisit = fv === '처음이에요' ? true : fv === '와본 적 있어요' ? false : undefined
  const r = await act(() =>
    submitPeerReviews(db, { themeId: id.data, fromUser: viewer.id, reviews, firstVisit }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath('/trips/past')
  redirect('/trips/past')
}

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
