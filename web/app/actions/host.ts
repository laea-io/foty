'use server'

// 호스트 서버 액션 — 등록, 테마 게시·고치기·취소, 신청 결정, 일정, 공지, 체크인
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { requireHost, requireViewer } from '@/lib/server/auth/session'
import { confirmChange, decideChange, groupIds, propose } from '@/lib/server/domain/changes'
import { checkin, confirmSchedule, decide, hostCancel } from '@/lib/server/domain/flow'
import {
  addDate,
  editHost,
  editTheme,
  hostReview,
  joinHost,
  publishTheme,
  setMeetDetail,
  skipRequest,
} from '@/lib/server/domain/host'
import { notify } from '@/lib/server/domain/notify'
import { sendChat } from '@/lib/server/domain/trips'
import { FlowError } from '@/lib/server/domain/types'
import { loadTheme } from '@/lib/server/queries/theme-view'
import { act } from '@/lib/server/util/act'
import { type FormState, fail, num, str } from '@/lib/server/util/form'
import { addDays } from '@/lib/server/util/time'

// ── 호스트 등록 · 프로필 ─────────────────────────────
export async function joinHostAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireViewer('/host/join')
  const kind = str(f, 'kind') === 'resident' ? 'resident' : 'business'
  const r = await act(() =>
    joinHost(db, {
      userId: v.id,
      kind,
      name: kind === 'resident' ? v.name : str(f, 'name'),
      area: str(f, 'area').replace(/^남양주시\s*/, ''),
      intro: str(f, 'intro'),
      contact: str(f, 'contact'),
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/host/join')
  redirect('/host/join')
}

export async function editHostAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost('/host/profile/edit')
  const r = await act(() =>
    editHost(db, {
      userId: v.id,
      name: str(f, 'name'),
      area: str(f, 'area').replace(/^남양주시\s*/, ''),
      intro: str(f, 'intro'),
      contact: str(f, 'contact'),
    }),
  )
  if (!r.ok) return fail(r)
  redirect(r.data?.reverify ? '/host/join' : '/host')
}

// ── 테마 ─────────────────────────────────────────────
const stopSchema = z.array(
  z.object({
    placeId: z.string(),
    time: z.string(),
    stayMin: z.number(),
    next: z.string().nullable().optional(),
  }),
)

export async function publishThemeAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost('/host/new')
  let stops: z.infer<typeof stopSchema>
  try {
    stops = stopSchema.parse(JSON.parse(str(f, 'stops')))
  } catch {
    return { error: '코스를 다시 만들어 주세요' }
  }
  const r = await act(() =>
    publishTheme(db, {
      userId: v.id,
      corePlaceId: str(f, 'place'),
      title: str(f, 'title'),
      intro: str(f, 'intro'),
      day: str(f, 'day'),
      start: str(f, 'start'),
      min: num(f, 'min', 3),
      max: num(f, 'max', 6),
      costWon: num(f, 'cost', 0),
      stops,
      requestId: str(f, 'request') || undefined,
      meetMode: str(f, 'meetMode') === 'place' ? 'place' : 'station',
      origin: str(f, 'origin') || undefined,
      transit: str(f, 'transit') !== '0',
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/host')
  redirect(`/themes/${r.data}`)
}

export async function addDateAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const r = await act(() =>
    addDate(db, {
      userId: v.id,
      themeId: str(f, 'theme'),
      day: str(f, 'day'),
      start: str(f, 'start'),
      min: num(f, 'min', 3),
      max: num(f, 'max', 6),
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/host')
  redirect(`/themes/${r.data}`)
}

export async function cancelThemeAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const themeId = str(f, 'theme')
  const r = await act(() =>
    hostCancel(db, {
      themeId,
      hostUserId: v.id,
      reason: str(f, 'reason') || '기타',
      message: str(f, 'message'),
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/host')
  revalidatePath(`/themes/${themeId}`)
  // 취소는 끝났다. "일주일 뒤 다시 열기"는 따로 해 보고, 안 되면 날짜 추가 화면으로 보낸다
  if (f.get('reopen') === 'on') {
    const re = await act(async () => {
      const t = await loadTheme(db, themeId)
      if (!t) throw new FlowError('not-found', '테마를 찾을 수 없어요')
      return addDate(db, {
        userId: v.id,
        themeId,
        day: addDays(t.day, 7),
        start: t.start,
        min: t.min,
        max: t.max,
      })
    })
    if (!re.ok) redirect(`/host/themes/${themeId}/add-date`)
  }
  redirect('/host')
}

export async function decideAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const r = await act(() =>
    decide(db, { applicationId: str(f, 'application'), hostUserId: v.id, accept: str(f, 'accept') === '1' }),
  )
  if (!r.ok) return fail(r)
  revalidatePath(`/host/themes/${str(f, 'theme')}/applicants`)
  return { done: true }
}

export async function skipRequestAction(f: FormData) {
  const v = await requireHost('/host/requests')
  await skipRequest(db, { userId: v.id, requestId: str(f, 'request') })
  revalidatePath('/host/requests')
}

// ── 일정 편집 · 확정 · 평가 · 체크인 ─────────────────
export async function decideChangeAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const r = await act(() =>
    decideChange(db, { changeId: str(f, 'change'), hostUserId: v.id, accept: str(f, 'accept') === '1' }),
  )
  if (!r.ok) return fail(r)
  revalidatePath(`/host/themes/${str(f, 'theme')}/space`)
  return { done: true }
}

/** 핵심 장소 시간 바꾸기 — 주요 변경이라 참여자 모두 확인 */
export async function coreTimeAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const time = str(f, 'time')
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: '시간을 09:30처럼 적어 주세요' }
  const r = await act(async () => {
    const c = await propose(db, {
      themeId: str(f, 'theme'),
      userId: v.id,
      kind: 'core_time',
      label: '핵심 장소 시간',
      from: str(f, 'from'),
      to: time,
      payload: { time },
    })
    await confirmChange(db, { changeId: c.id, userId: v.id })
  })
  if (!r.ok) return fail(r)
  revalidatePath(`/host/themes/${str(f, 'theme')}/space`)
  return { done: true }
}

export async function confirmScheduleAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const r = await act(() => confirmSchedule(db, { themeId: str(f, 'theme'), hostUserId: v.id }))
  if (!r.ok) return fail(r)
  revalidatePath(`/host/themes/${str(f, 'theme')}/space`)
  return { done: true }
}

/** 참여자에게 공지 — 그룹 대화에 호스트 이름으로 */
export async function announceAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const body = str(f, 'body').trim()
  if (!body) return { error: '공지할 내용을 적어 주세요' }
  const themeId = str(f, 'theme')
  const r = await act(async () => {
    const ids = await groupIds(db, themeId)
    if (ids[0] !== v.id) throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
    // 대화창에 바로 뜨게(sendChat이 pg_notify까지) + 참여자에게 알림
    await sendChat(db, { themeId, userId: v.id, body: `[공지] ${body.slice(0, 990)}` })
    await notify(db, ids.slice(1), {
      title: '호스트 공지',
      body: body.slice(0, 80),
      href: `/trips/${themeId}/chat`,
    })
  })
  if (!r.ok) return fail(r)
  revalidatePath(`/host/themes/${themeId}/space`)
  return { done: true }
}

export async function hostReviewAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const tags: Record<string, string[]> = {}
  const attendance: Record<string, '불참 확인' | '참여 확인'> = {}
  for (const [k, val] of f.entries()) {
    if (k.startsWith('tag:')) {
      const id = k.slice(4)
      tags[id] = [...(tags[id] ?? []), String(val)]
    }
    if (k.startsWith('att:')) attendance[k.slice(4)] = String(val) === '불참 확인' ? '불참 확인' : '참여 확인'
  }
  for (const k of f.getAll('members')) tags[String(k)] ??= []
  const r = await act(() => hostReview(db, { userId: v.id, themeId: str(f, 'theme'), tags, attendance }))
  if (!r.ok) return fail(r)
  redirect('/host/past')
}

/** QR 없이 호스트가 직접 확인 */
export async function manualCheckinAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost('/host/checkin')
  const themeId = str(f, 'theme')
  const r = await act(async () => {
    const ids = await groupIds(db, themeId)
    if (ids[0] !== v.id) throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
    await checkin(db, { themeId, userId: str(f, 'user'), method: 'host', anyDay: env.DEMO_MODE === '1' })
  })
  if (!r.ok) return fail(r)
  revalidatePath('/host/checkin')
  return { done: true }
}

export async function editThemeAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const themeId = str(f, 'theme')
  const r = await act(() =>
    editTheme(db, {
      userId: v.id,
      themeId,
      title: str(f, 'title'),
      intro: str(f, 'intro'),
      include: str(f, 'include'),
      exclude: str(f, 'exclude'),
      max: num(f, 'max', 6),
      costWon: num(f, 'cost', 0),
    }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath(`/themes/${themeId}`)
  revalidatePath('/host')
  redirect(`/themes/${themeId}`)
}

export async function meetDetailAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const themeId = str(f, 'theme')
  const r = await act(() => setMeetDetail(db, { userId: v.id, themeId, text: str(f, 'meet') }))
  if (!r.ok) return { error: r.error }
  revalidatePath(`/host/themes/${themeId}/space`)
  revalidatePath(`/trips/${themeId}`)
  return { done: true }
}
