// 그룹 C 쓰기(코스 · 커뮤니티 · 호스트) — DB를 인자로 받아 시험할 수 있게.

import { and, eq, inArray, or } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { findStation, travelEstimate } from '@/lib/stations'
import { rules } from '../rules'
import { memberIds } from './flow'
import { notify } from './notify'
import { type AnyDb, FlowError } from './types'

const DAY = /^\d{4}-\d{2}-\d{2}$/
const HM = /^([01]\d|2[0-3]):[0-5]\d$/

async function hostOf(db: AnyDb, userId: string) {
  const [h] = await db.select().from(s.hosts).where(eq(s.hosts.userId, userId))
  if (!h) throw new FlowError('not-host', '호스트로 등록한 뒤에 할 수 있어요')
  return h
}

/** 호스트 등록(가게·관광지 / 주민) — 운영팀 확인 대기로 들어간다 */
export async function joinHost(
  db: AnyDb,
  input: {
    userId: string
    kind: 'business' | 'resident'
    name: string
    area: string
    intro?: string
    contact?: string
  },
) {
  const [prev] = await db.select().from(s.hosts).where(eq(s.hosts.userId, input.userId))
  const values = {
    kind: input.kind,
    name: input.name.trim().slice(0, 30),
    area: input.area.trim().slice(0, 30),
    intro: (input.intro ?? '').trim().slice(0, 200),
    contact: (input.contact ?? '').trim().slice(0, 60),
    confirmMode: rules.confirm[input.kind],
    status: '확인 대기' as const,
    submittedAt: new Date(),
  }
  if (!values.name || !values.area) throw new FlowError('input', '이름과 동네를 적어 주세요')
  if (prev) {
    if (prev.status === '확인 완료') throw new FlowError('done', '이미 확인된 호스트예요')
    if (prev.status === '정지')
      throw new FlowError('suspended', '이용이 멈춘 호스트예요. 고객센터로 문의해 주세요')
  }
  const id = prev?.id ?? `h-${crypto.randomUUID().slice(0, 8)}`
  if (prev) await db.update(s.hosts).set(values).where(eq(s.hosts.id, prev.id))
  else await db.insert(s.hosts).values({ id, userId: input.userId, ...values })
  const admins = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.role, 'admin'))
  await notify(
    db,
    admins.map((a) => a.id),
    {
      title: prev ? '호스트 확인 요청을 다시 보냈어요' : '호스트 확인 요청이 왔어요',
      body: values.name,
      href: '/admin',
    },
  )
  return id
}

/** 호스트 프로필 편집 — 상호·동네가 바뀌면 사업장 확인을 다시 한다 */
export async function editHost(
  db: AnyDb,
  input: { userId: string; name: string; area: string; intro: string; contact: string },
) {
  const h = await hostOf(db, input.userId)
  // 사업장 상호·동네가 바뀌거나, 보류된 호스트가 고쳐 다시 내면 운영팀이 다시 확인한다
  const changed =
    h.status === '보류' ||
    (h.kind === 'business' && (input.name.trim() !== h.name || input.area.trim() !== h.area))
  await db
    .update(s.hosts)
    .set({
      name: input.name.trim().slice(0, 30) || h.name,
      area: input.area.trim().slice(0, 30) || h.area,
      intro: input.intro.trim().slice(0, 200),
      contact: input.contact.trim().slice(0, 60),
      ...(changed ? { status: '확인 대기' as const, verifiedAt: null } : {}),
    })
    .where(eq(s.hosts.id, h.id))
  if (changed) {
    const admins = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.role, 'admin'))
    await notify(
      db,
      admins.map((a) => a.id),
      { title: '호스트 정보가 바뀌어 다시 확인이 필요해요', body: input.name, href: '/admin' },
    )
  }
  return { reverify: changed }
}

export type NewTheme = {
  userId: string
  corePlaceId: string
  title: string
  intro: string
  day: string
  start: string
  min: number
  max: number
  costWon: number
  stops: { placeId: string; time: string; stayMin: number; next?: string | null; fixed?: boolean }[]
  /** 참여자 테마 요청에서 열었으면 그 요청 id(요청한 사람에게 알림) */
  requestId?: string
  /** 'station' 역에서 모여 이동 · 'place' 첫 장소에서 만나기 */
  meetMode?: 'station' | 'place'
  origin?: string
  transit?: boolean
}

/** 테마 게시 — 확인된 호스트만. 핵심 장소는 고정, 마감은 전날 18:00 */
export async function publishTheme(db: AnyDb, t: NewTheme, now = new Date()) {
  const h = await hostOf(db, t.userId)
  if (h.status !== '확인 완료') throw new FlowError('unverified', '운영팀 확인이 끝나면 테마를 열 수 있어요')
  if (!DAY.test(t.day) || !HM.test(t.start)) throw new FlowError('input', '날짜와 시간을 확인해 주세요')
  if (t.min < 2 || t.max < t.min || t.max > 12) throw new FlowError('input', '인원을 확인해 주세요')
  if (!t.stops.length || !t.stops.some((x) => x.placeId === t.corePlaceId))
    throw new FlowError('input', '코스에 핵심 장소가 있어야 해요')
  const [y, m, d] = t.day.split('-').map(Number)
  const prev = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
  const deadline = new Date(`${prev}T${String(rules.deadlineHour).padStart(2, '0')}:00:00+09:00`)
  if (deadline <= now)
    throw new FlowError('too-soon', '모집 마감(전날 18:00)이 지나지 않은 날짜를 골라 주세요')
  const [core] = await db.select().from(s.places).where(eq(s.places.id, t.corePlaceId))
  if (!core) throw new FlowError('input', '핵심 장소를 찾을 수 없어요')
  const ids = t.stops.map((x) => x.placeId)
  const places = await db.select().from(s.places).where(inArray(s.places.id, ids))
  const groups = new Set(places.map((p) => p.group))
  const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3))
  const last = t.stops[t.stops.length - 1]
  const endMin = toMin(last.time) + last.stayMin
  const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
  const id = `${t.corePlaceId}-${t.day.slice(5).replace('-', '')}-${crypto.randomUUID().slice(0, 4)}`
  // 모이는 역(없으면 상봉역) → 핵심 장소까지 이동 시간은 직선거리로 어림한다
  const station = t.meetMode === 'place' ? null : (findStation(t.origin) ?? findStation('상봉역'))
  const firstName = places.find((p) => p.id === t.stops[0].placeId)?.name ?? core.name
  const travelMin =
    station && core.lat && core.lng
      ? travelEstimate(station, { lat: core.lat, lng: core.lng }, t.transit === false)
      : 45
  await db.transaction(async (tx) => {
    await tx.insert(s.themes).values({
      id,
      hostId: h.id,
      corePlaceId: t.corePlaceId,
      title: t.title.trim().slice(0, 40) || `${core.name}에서 보내는 하루`,
      intro: t.intro.trim().slice(0, 200),
      day: t.day,
      end,
      min: t.min,
      max: t.max,
      deadline,
      costWon: Math.max(0, t.costWon),
      activities: [...groups].filter((g) => g !== '기타').map((g) => (g === '자연' ? '자연' : g)),
      confirmMode: h.confirmMode,
      start: t.stops[0].time,
      origin: station?.name ?? core.area,
      travelMin,
      transit: t.transit ?? true,
      meet:
        t.meetMode === 'place'
          ? `각자 ${firstName}에서 만나요. 상세 위치는 성사 후 공개돼요.`
          : `${station?.name ?? '상봉역'}에서 모여 함께 이동해요. 상세 위치는 성사 후 공개돼요.`,
      exclude: '교통비 · 현장에서 각자 결제',
    })
    await tx.insert(s.themeStops).values(
      t.stops.map((x, ord) => ({
        themeId: id,
        ord,
        placeId: x.placeId,
        time: x.time,
        stayMin: x.stayMin,
        next: x.next ?? null,
        fixed: x.placeId === t.corePlaceId,
      })),
    )
    // 참여자 요청에서 열었으면 요청한 사람에게
    if (t.requestId) {
      const req = await tx
        .select({ userId: s.themeRequests.userId })
        .from(s.themeRequests)
        .where(eq(s.themeRequests.id, t.requestId))
      await notify(
        tx,
        req.map((x) => x.userId),
        { title: '요청하신 테마가 열렸어요', body: t.title, href: `/themes/${id}` },
      )
    }
    // 새 테마 알림을 구독한 사람들
    // 이 호스트를 구독한 사람 + "새 테마 알림 받기"를 켠 사람(호스트 본인 제외, 한 번씩)
    const subs = await tx
      .select({ userId: s.subscriptions.userId })
      .from(s.subscriptions)
      .where(
        or(
          and(eq(s.subscriptions.kind, 'host'), eq(s.subscriptions.key, h.id)),
          and(eq(s.subscriptions.kind, 'place'), eq(s.subscriptions.key, t.corePlaceId)),
          eq(s.subscriptions.kind, 'all'),
        ),
      )
    await notify(
      tx,
      [...new Set(subs.map((x) => x.userId))].filter((u) => u !== t.userId),
      { title: `${h.name} 님이 새 테마를 열었어요`, body: t.title, href: `/themes/${id}` },
    )
  })
  return id
}

/** 같은 테마 다른 날짜 — 코스·인원을 그대로 가져와 새로 게시 */
export async function addDate(
  db: AnyDb,
  input: { userId: string; themeId: string; day: string; start: string; min: number; max: number },
  now = new Date(),
) {
  const h = await hostOf(db, input.userId)
  const [t] = await db
    .select()
    .from(s.themes)
    .where(and(eq(s.themes.id, input.themeId), eq(s.themes.hostId, h.id)))
  if (!t) throw new FlowError('not-found', '내 테마가 아니에요')
  const stops = await db
    .select()
    .from(s.themeStops)
    .where(eq(s.themeStops.themeId, t.id))
    .orderBy(s.themeStops.ord)
  const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3))
  const shift = toMin(input.start) - toMin(t.start)
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const last = stops[stops.length - 1]
  if (
    stops.length &&
    (toMin(stops[0].time) + shift < 5 * 60 || toMin(last.time) + last.stayMin + shift > 23 * 60 + 59)
  )
    throw new FlowError('input', '코스가 하루 안에 끝나도록 시작 시간을 골라 주세요')
  return publishTheme(
    db,
    {
      userId: input.userId,
      corePlaceId: t.corePlaceId,
      title: t.title,
      intro: t.intro,
      day: input.day,
      start: input.start,
      min: input.min,
      max: input.max,
      costWon: t.costWon,
      stops: stops.map((x) => ({
        placeId: x.placeId,
        time: fmt(toMin(x.time) + shift),
        stayMin: x.stayMin,
        next: x.next,
        fixed: x.fixed,
      })),
      // 모이는 곳·이동 방법은 원래 테마를 따른다
      meetMode: t.meet.startsWith('각자') ? 'place' : 'station',
      origin: t.origin,
      transit: t.transit,
    },
    now,
  )
}

/** 테마 요청 넘기기(이 호스트 화면에서만 숨김) */
export async function skipRequest(db: AnyDb, input: { userId: string; requestId: string }) {
  const h = await hostOf(db, input.userId)
  await db.insert(s.requestSkips).values({ hostId: h.id, requestId: input.requestId }).onConflictDoNothing()
}

/** 호스트의 참여자 평가 — 체크인한 사람은 행동 태그, 체크인 없는 사람은 참여 여부 */
export async function hostReview(
  db: AnyDb,
  input: {
    userId: string
    themeId: string
    tags: Record<string, string[]>
    attendance: Record<string, '불참 확인' | '참여 확인'>
  },
) {
  const h = await hostOf(db, input.userId)
  const [t] = await db
    .select()
    .from(s.themes)
    .where(and(eq(s.themes.id, input.themeId), eq(s.themes.hostId, h.id)))
  if (!t) throw new FlowError('not-found', '내 테마가 아니에요')
  if (t.status !== '여행 완료') throw new FlowError('not-done', '여행이 끝난 뒤에 평가할 수 있어요')
  const members = await memberIds(db, t.id)
  const checks = await db
    .select({ userId: s.checkins.userId })
    .from(s.checkins)
    .where(eq(s.checkins.themeId, t.id))
  const checked = new Set(checks.map((c) => c.userId))
  await db.transaction(async (tx) => {
    for (const [userId, tags] of Object.entries(input.tags)) {
      if (!members.includes(userId) || !checked.has(userId)) continue
      const clean = tags.filter((x) => rules.behaviorTags.includes(x))
      await tx
        .insert(s.peerReviews)
        .values({ themeId: t.id, fromUser: input.userId, toUser: userId, tags: clean })
        .onConflictDoUpdate({
          target: [s.peerReviews.themeId, s.peerReviews.fromUser, s.peerReviews.toUser],
          set: { tags: clean },
        })
    }
    for (const [userId, status] of Object.entries(input.attendance)) {
      if (!members.includes(userId) || checked.has(userId)) continue
      // 호스트의 확인과 체크인 기록이 어긋나면 검토 중으로(운영팀이 본다)
      const next = status === '불참 확인' ? '불참 확인' : '검토 중'
      await tx
        .insert(s.attendance)
        .values({ themeId: t.id, userId, status: next, note: `호스트: ${status}` })
        .onConflictDoUpdate({
          target: [s.attendance.themeId, s.attendance.userId],
          set: { status: next, note: `호스트: ${status}`, updatedAt: new Date() },
        })
    }
  })
}

/** 코스 저장 / 후기에서 가져오기 */
export async function saveCourse(
  db: AnyDb,
  input: {
    userId: string
    corePlaceId: string
    title: string
    stops: string[]
    day?: string | null
    fromPostId?: string
  },
) {
  if (input.fromPostId) {
    const [p] = await db.select().from(s.posts).where(eq(s.posts.id, input.fromPostId))
    if (!p?.allowCopy) throw new FlowError('no-copy', '이 후기는 코스 가져오기를 허용하지 않았어요')
  }
  const [row] = await db
    .insert(s.savedCourses)
    .values({
      userId: input.userId,
      corePlaceId: input.corePlaceId,
      title: input.title.slice(0, 40),
      stops: input.stops,
      day: input.day ?? null,
      fromPostId: input.fromPostId,
    })
    .returning()
  return row.id
}

/** 글 쓰기 — 여행 후기는 그 테마에서 체크인한 사람만(실제 방문 기반) */
export async function writePost(
  db: AnyDb,
  input: {
    userId: string
    kind: '여행 후기' | '코스 공유' | '질문'
    title: string
    body: string
    themeId?: string
    placeId?: string
    photos?: string[]
    transport?: string
    changedPlace?: string
    spentWon?: number | null
    public?: boolean
    allowCopy?: boolean
  },
) {
  const title = input.title.trim().slice(0, 60)
  const body = input.body.trim().slice(0, 2000)
  if (!title || !body) throw new FlowError('input', '제목과 내용을 적어 주세요')
  let placeId = input.placeId
  let visitedOn: string | null = null
  if (input.kind === '여행 후기') {
    if (!input.themeId) throw new FlowError('input', '다녀온 테마를 골라 주세요')
    const [c] = await db
      .select({ placeId: s.checkins.placeId, day: s.themes.day })
      .from(s.checkins)
      .innerJoin(s.themes, eq(s.themes.id, s.checkins.themeId))
      .where(and(eq(s.checkins.themeId, input.themeId), eq(s.checkins.userId, input.userId)))
    if (!c) throw new FlowError('no-visit', '체크인한 테마에만 후기를 남길 수 있어요')
    placeId = c.placeId
    visitedOn = c.day
  }
  const id = `p-${crypto.randomUUID().slice(0, 8)}`
  await db.insert(s.posts).values({
    id,
    kind: input.kind,
    authorId: input.userId,
    themeId: input.themeId ?? null,
    placeId: placeId ?? null,
    title,
    body,
    photos: (input.photos ?? []).slice(0, 6),
    transport: input.transport ?? null,
    changedPlace: input.changedPlace?.trim() || null,
    spentWon: input.spentWon ?? null,
    public: input.public ?? true,
    allowCopy: input.allowCopy ?? true,
    visitedOn,
  })
  return id
}

/** 질문에 답하기 */
export async function answer(db: AnyDb, input: { userId: string; postId: string; body: string }) {
  const body = input.body.trim().slice(0, 1000)
  if (!body) throw new FlowError('input', '답변을 적어 주세요')
  const [p] = await db.select().from(s.posts).where(eq(s.posts.id, input.postId))
  if (!p) throw new FlowError('not-found', '글을 찾을 수 없어요')
  await db.insert(s.comments).values({ postId: p.id, authorId: input.userId, body })
  if (p.authorId !== input.userId)
    await notify(db, [p.authorId], {
      title: '질문에 답변이 달렸어요',
      body: p.title,
      href: `/community/${p.id}`,
    })
}
