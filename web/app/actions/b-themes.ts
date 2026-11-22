'use server'

// 그룹 B — 테마 참여: 신청 · 취소 · 친구와 함께 · 테마 요청 · 새 날짜 알림 · 조건 결과 수
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import type { HomeQuery } from '@/lib/demo/filters'
import { act } from '@/lib/server/act'
import { requireViewer } from '@/lib/server/auth'
import { joinInvite, makeSolo, setHostSubscription, submitRequest } from '@/lib/server/b/writes'
import { inviteOk } from '@/lib/server/checkin-token'
import { apply, cancelApplication } from '@/lib/server/domain/flow'
import { loadTheme } from '@/lib/server/domain/read'
import { homeThemes } from '@/lib/server/q/themes'

export type FormState = { error?: string; ok?: boolean } | undefined

const themeId = z.string().min(1).max(80)

/** 신청 보내기 → 신청 완료(친구와 함께면 초대 화면 · 지금 성사됐으면 성사 화면) */
export async function applyAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      themeId,
      party: z.coerce.number().int().min(1).max(2).default(1),
      message: z.string().max(200).default(''),
      agreed: z.literal('on', { message: '안내를 확인하고 체크해 주세요' }),
    })
    .safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력을 확인해 주세요' }
  const d = parsed.data
  const viewer = await requireViewer(`/themes/${d.themeId}/apply`)
  const before = (await loadTheme(db, d.themeId))?.current ?? 0
  const r = await act(() =>
    apply(db, { themeId: d.themeId, userId: viewer.id, party: d.party, message: d.message.trim() }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath(`/themes/${d.themeId}`)
  revalidatePath('/trips')
  if (d.party === 2) redirect(`/themes/${d.themeId}/invite`)
  const after = await loadTheme(db, d.themeId)
  if (r.data?.status === '수락' && after && before < after.min && after.current >= after.min)
    redirect(`/themes/${d.themeId}/matched`)
  redirect(`/themes/${d.themeId}/applied`)
}

/** 신청 취소(성사 전) → 취소 완료 */
export async function cancelAction(_: FormState, form: FormData): Promise<FormState> {
  const id = themeId.safeParse(form.get('themeId'))
  if (!id.success) return { error: '테마를 찾을 수 없어요' }
  const viewer = await requireViewer(`/themes/${id.data}`)
  const r = await act(() => cancelApplication(db, { themeId: id.data, userId: viewer.id }))
  if (!r.ok) return { error: r.error }
  revalidatePath('/trips')
  redirect(`/themes/${id.data}/cancel-done`)
}

/** 친구와 함께 → 혼자 신청으로 바꾸기 */
export async function soloAction(_: FormState, form: FormData): Promise<FormState> {
  const id = themeId.safeParse(form.get('themeId'))
  if (!id.success) return { error: '테마를 찾을 수 없어요' }
  const viewer = await requireViewer(`/themes/${id.data}/invite`)
  const r = await act(() => makeSolo(db, { themeId: id.data, userId: viewer.id }))
  if (!r.ok) return { error: r.error }
  redirect(`/themes/${id.data}/applied`)
}

/** 초대 링크에서 함께 신청하기 — 친구 본인의 신청(1명) */
export async function joinAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ themeId, a: z.string().uuid(), s: z.string().min(4).max(64) })
    .safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: '초대 링크가 맞지 않아요' }
  const d = parsed.data
  const here = `/themes/${d.themeId}/join?a=${d.a}&s=${encodeURIComponent(d.s)}`
  const viewer = await requireViewer(here)
  if (!inviteOk(d.a, d.s)) return { error: '초대 링크가 맞지 않아요' }
  const before = (await loadTheme(db, d.themeId))?.current ?? 0
  const r = await act(() =>
    joinInvite(db, { themeId: d.themeId, inviterApplicationId: d.a, userId: viewer.id }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath('/trips')
  const after = await loadTheme(db, d.themeId)
  if (r.data?.status === '수락' && after && before < after.min && after.current >= after.min)
    redirect(`/themes/${d.themeId}/matched`)
  redirect(`/themes/${d.themeId}/applied`)
}

/** 테마 요청 남기기 */
export async function requestAction(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer('/request')
  const parsed = z
    .object({
      body: z.string().max(300).default(''),
      when: z.string().max(20),
      tags: z.array(z.string().max(20)).max(10),
    })
    .safeParse({ body: form.get('body') ?? '', when: form.get('when') ?? '', tags: form.getAll('tags') })
  if (!parsed.success) return { error: '입력을 확인해 주세요' }
  const r = await act(() => submitRequest(db, { userId: viewer.id, ...parsed.data }))
  if (!r.ok) return { error: r.error }
  return { ok: true }
}

/** 새 날짜 알림 받기(이 호스트의 새 테마) */
export async function subscribeAction(input: { hostId: string; themeId: string; on: boolean }) {
  const viewer = await requireViewer(`/themes/${input.themeId}`)
  const hostId = z.string().min(1).max(80).parse(input.hostId)
  return act(() => setHostSubscription(db, { userId: viewer.id, hostId, on: !!input.on }))
}

/** 조건 화면의 “테마 n개 보기” */
export async function countThemesAction(q: HomeQuery) {
  const clean: HomeQuery = {
    view: q.view === 'next' || q.view === 'all' ? q.view : 'weekend',
    day: typeof q.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q.day) ? q.day : undefined,
    origin: typeof q.origin === 'string' ? q.origin.slice(0, 20) : '상봉역',
    at: typeof q.at === 'string' && /^-?[\d.]+,-?[\d.]+$/.test(q.at) ? q.at.slice(0, 30) : undefined,
    transit: q.transit === '0' ? '0' : '1',
    budget: typeof q.budget === 'string' ? q.budget.slice(0, 20) : undefined,
    act: typeof q.act === 'string' ? q.act.slice(0, 80) : undefined,
  }
  return (await homeThemes(clean)).length
}
