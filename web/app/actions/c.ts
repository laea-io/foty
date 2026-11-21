'use server'
// 그룹 C 쓰기 — 코스 · 커뮤니티 · 호스트
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { act } from '@/lib/server/act'
import { requireHost, requireViewer } from '@/lib/server/auth'
import * as C from '@/lib/server/domain/c'
import { confirmChange, decideChange, propose } from '@/lib/server/domain/changes'
import { checkin, confirmSchedule, decide, hostCancel } from '@/lib/server/domain/flow'
import { FlowError } from '@/lib/server/domain/types'
import { saveImage } from '@/lib/server/uploads'

export type FormState = { error?: string; done?: boolean } | undefined
const fail = (r: { ok: false; error: string }) => ({ error: r.error })
const str = (f: FormData, k: string) => String(f.get(k) ?? '')
const num = (f: FormData, k: string, d = 0) => {
  const n = Number.parseInt(str(f, k).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : d
}

// ── 코스 ─────────────────────────────────────────────
export async function saveCourseAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireViewer(`/course?place=${str(f, 'place')}`)
  const r = await act(() =>
    C.saveCourse(db, {
      userId: v.id,
      corePlaceId: str(f, 'place'),
      title: str(f, 'title'),
      stops: str(f, 'stops').split(',').filter(Boolean),
      fromPostId: str(f, 'post') || undefined,
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/course/saved')
  return { done: true }
}

// ── 커뮤니티 ─────────────────────────────────────────
export async function writePostAction(_: FormState, f: FormData): Promise<FormState> {
  const kind = z.enum(['여행 후기', '코스 공유', '질문']).catch('여행 후기').parse(str(f, 'kind'))
  const v = await requireViewer(kind === '질문' ? '/community/ask' : '/community/write')
  const photos: string[] = []
  try {
    for (const file of f.getAll('photos'))
      if (file instanceof File && file.size) photos.push(await saveImage(file))
  } catch (e) {
    return { error: (e as Error).message }
  }
  const r = await act(() =>
    C.writePost(db, {
      userId: v.id,
      kind,
      title: str(f, 'title') || (kind === '여행 후기' ? `${str(f, 'themeTitle')} 후기` : ''),
      body: str(f, 'body'),
      themeId: str(f, 'theme') || undefined,
      placeId: str(f, 'place') || undefined,
      photos: [
        ...str(f, 'keep')
          .split(',')
          .filter((x) => x.startsWith('/')),
        ...photos,
      ],
      transport: str(f, 'transport') || undefined,
      changedPlace: str(f, 'changed'),
      spentWon: num(f, 'spent', 0) || null,
      public: f.get('public') === 'on',
      allowCopy: f.get('copy') === 'on',
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/community')
  redirect(`/community/${r.data}`)
}

export async function answerAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireViewer(`/community/${str(f, 'post')}`)
  const r = await act(() => C.answer(db, { userId: v.id, postId: str(f, 'post'), body: str(f, 'body') }))
  if (!r.ok) return fail(r)
  revalidatePath(`/community/${str(f, 'post')}`)
  return { done: true }
}

// ── 호스트 등록 · 프로필 ─────────────────────────────
export async function joinHostAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireViewer('/host/join')
  const kind = str(f, 'kind') === 'resident' ? 'resident' : 'business'
  const r = await act(() =>
    C.joinHost(db, {
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
    C.editHost(db, {
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
    C.publishTheme(db, {
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
    }),
  )
  if (!r.ok) return fail(r)
  revalidatePath('/host')
  redirect(`/themes/${r.data}`)
}

export async function addDateAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost()
  const r = await act(() =>
    C.addDate(db, {
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
  const r = await act(async () => {
    await hostCancel(db, {
      themeId,
      hostUserId: v.id,
      reason: str(f, 'reason') || '기타',
      message: str(f, 'message'),
    })
    if (f.get('reopen') === 'on') {
      const { addDays } = await import('@/lib/server/time')
      const { loadTheme } = await import('@/lib/server/domain/read')
      const t = await loadTheme(db, themeId)
      if (t)
        await C.addDate(db, {
          userId: v.id,
          themeId,
          day: addDays(t.day, 7),
          start: t.start,
          min: t.min,
          max: t.max,
        })
    }
  })
  if (!r.ok) return fail(r)
  revalidatePath('/host')
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
  await C.skipRequest(db, { userId: v.id, requestId: str(f, 'request') })
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
  const { groupIds } = await import('@/lib/server/domain/changes')
  const { schema } = await import('@/lib/db')
  const themeId = str(f, 'theme')
  const r = await act(async () => {
    const ids = await groupIds(db, themeId)
    if (ids[0] !== v.id) throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
    await db.insert(schema.messages).values({ themeId, userId: v.id, body: `[공지] ${body}` })
  })
  if (!r.ok) return fail(r)
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
  const r = await act(() => C.hostReview(db, { userId: v.id, themeId: str(f, 'theme'), tags, attendance }))
  if (!r.ok) return fail(r)
  redirect('/host/past')
}

/** QR 없이 호스트가 직접 확인 */
export async function manualCheckinAction(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireHost('/host/checkin')
  const themeId = str(f, 'theme')
  const { groupIds } = await import('@/lib/server/domain/changes')
  const { env } = await import('@/lib/env')
  const r = await act(async () => {
    const ids = await groupIds(db, themeId)
    if (ids[0] !== v.id) throw new FlowError('forbidden', '이 테마의 호스트가 아니에요')
    await checkin(db, { themeId, userId: str(f, 'user'), method: 'host', anyDay: env.DEMO_MODE === '1' })
  })
  if (!r.ok) return fail(r)
  revalidatePath('/host/checkin')
  return { done: true }
}
