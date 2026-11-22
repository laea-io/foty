import 'server-only'
// 그룹 C(코스 · 커뮤니티 · 호스트) 읽기
import { and, asc, count, desc, eq, gte, inArray, lt, notInArray, sql } from 'drizzle-orm'
import { db, schema as s } from '@/lib/db'
import type { Img } from '@/lib/demo/themes'
import { getViewer } from '../auth'
import { loadThemes, type ThemeView } from '../domain/read'
import { draftCourse } from '../suggest'
import { addDays, ago, dayLabel, hhmm, parts, today, won } from '../time'
import { LISTED } from './themes'

const img = (p: typeof s.places.$inferSelect): Img => ({ src: p.image, alt: p.imageAlt, bg: p.imageBg })
const checkedLabel = (d: string | null) => (d ? `${parts(d).m}월 ${parts(d).d}일` : null)

// ── 코스 ─────────────────────────────────────────────
export type PlaceItem = {
  id: string
  name: string
  area: string
  kind: string
  checked: string | null
  image: Img
  group: string
  open: number
}

/** 핵심 장소로 고를 수 있는 장소(집결 같은 기타 제외) + 열린 테마 수 */
export async function corePlaces(): Promise<PlaceItem[]> {
  const rows = await db
    .select()
    .from(s.places)
    .where(sql`${s.places.group} <> '기타'`)
    .orderBy(desc(s.places.stamp), asc(s.places.name))
  const open = await db
    .select({ placeId: s.themeStops.placeId, n: sql<number>`count(distinct ${s.themes.id})::int` })
    .from(s.themeStops)
    .innerJoin(s.themes, eq(s.themes.id, s.themeStops.themeId))
    .where(and(eq(s.themes.status, '모집 중'), gte(s.themes.day, today())))
    .groupBy(s.themeStops.placeId)
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    area: p.area,
    kind: p.kind,
    checked: checkedLabel(p.checkedOn),
    image: img(p),
    group: p.group,
    open: Number(open.find((o) => o.placeId === p.id)?.n ?? 0),
  }))
}

export type CourseData = {
  place: PlaceItem
  date: string
  hours: string
  cost: string
  move: string
  stops: ThemeView['stops']
  /** 저장할 때 쓰는 장소 id 순서 */
  placeIds: string[]
  /** 적용한 요청(덜 걷는 코스로 등) */
  ask?: string
  open: ThemeView[]
}

/** 핵심 장소 하나로 하루 코스(검토된 장소에서 초안) + 이 코스 안 장소에 열린 테마 */
export async function courseFor(placeId?: string, ask?: string): Promise<CourseData | null> {
  const places = await corePlaces()
  const place =
    places.find((p) => p.id === placeId) ?? places.find((p) => p.id === 'dasan-hanjeongsik') ?? places[0]
  if (!place) return null
  const draft = await draftCourse(db, { corePlaceId: place.id, start: '11:30', ask })
  const stops = draft.map((d) => ({
    name: d.place.name,
    time: d.time,
    stay: `${d.stayMin}분`,
    kind: d.place.kind,
    checked: checkedLabel(d.place.checkedOn),
    next: d.next ?? undefined,
    fixed: d.fixed,
    image: img(d.place),
    lat: d.place.lat,
    lng: d.place.lng,
  }))
  const ids = draft.map((d) => d.placeId)
  const themeIds = await db
    .selectDistinct({ id: s.themes.id })
    .from(s.themes)
    .innerJoin(s.themeStops, eq(s.themeStops.themeId, s.themes.id))
    .where(
      and(inArray(s.themeStops.placeId, ids), eq(s.themes.status, '모집 중'), gte(s.themes.day, today())),
    )
  const viewer = await getViewer()
  const open = themeIds.length
    ? await loadThemes(db, { ids: themeIds.map((t) => t.id), prefs: viewer?.prefs.activities })
    : []
  const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3))
  const last = draft[draft.length - 1]
  const hours = last ? Math.round((toMin(last.time) + last.stayMin - toMin(draft[0].time)) / 60) : 0
  const cost = draft.reduce((n, d) => n + d.place.cost, 0)
  return {
    place,
    date: dayLabel(addDays(today(), (6 - new Date(`${today()}T00:00:00Z`).getUTCDay() + 7) % 7)),
    hours: `${hours}시간`,
    cost: cost ? won(Math.round(cost / 1000) * 1000) : '무료',
    move: '대중교통',
    stops,
    placeIds: ids,
    ask,
    open: open.slice(0, 2),
  }
}

export type SavedRow = { id: string; title: string; meta: string; image: Img; placeId: string }

export async function savedCourses(userId: string): Promise<{ mine: SavedRow[]; imported: SavedRow[] }> {
  const rows = await db
    .select({ c: s.savedCourses, p: s.places, author: s.users.name })
    .from(s.savedCourses)
    .innerJoin(s.places, eq(s.places.id, s.savedCourses.corePlaceId))
    .leftJoin(s.posts, eq(s.posts.id, s.savedCourses.fromPostId))
    .leftJoin(s.users, eq(s.users.id, s.posts.authorId))
    .where(eq(s.savedCourses.userId, userId))
    .orderBy(desc(s.savedCourses.createdAt))
  const toRow = (r: (typeof rows)[number]): SavedRow => ({
    id: r.c.id,
    title: r.c.title,
    meta: r.c.fromPostId
      ? `${r.author ?? '누군가'} 님의 후기에서 가져왔어요`
      : `${r.c.stops.length}곳 · ${r.c.day ? dayLabel(r.c.day) : '날짜 미정'}`,
    image: img(r.p),
    placeId: r.p.id,
  })
  return {
    mine: rows.filter((r) => !r.c.fromPostId).map(toRow),
    imported: rows.filter((r) => r.c.fromPostId).map(toRow),
  }
}

// ── 커뮤니티 ─────────────────────────────────────────
export type PostView = {
  id: string
  kind: '여행 후기' | '코스 공유' | '질문'
  author: string
  authorHandle: string
  trips: number
  when: string
  title: string
  summary: string
  body: string
  photos: Img[]
  stamp?: string
  facts?: string[]
  themeId?: string
  coursePlace?: string
  /** 코스 가져오기에 쓰는 장소 id 순서 */
  courseStops: string[]
  answers: { author: string; body: string; when: string }[]
}

const photoImg = (src: string): Img => ({ src, alt: '후기 사진', bg: '#e6e1d8' })

export async function posts(kind?: string): Promise<PostView[]> {
  const conds = [eq(s.posts.public, true), kind ? sql`${s.posts.kind} = ${kind}` : undefined].filter(Boolean)
  const rows = await db
    .select({ p: s.posts, u: s.users })
    .from(s.posts)
    .innerJoin(s.users, eq(s.users.id, s.posts.authorId))
    .where(and(...conds))
    .orderBy(desc(s.posts.createdAt))
    .limit(50)
  return Promise.all(rows.map((r) => toPost(r.p, r.u, false)))
}

export async function post(id: string) {
  const [r] = await db
    .select({ p: s.posts, u: s.users })
    .from(s.posts)
    .innerJoin(s.users, eq(s.users.id, s.posts.authorId))
    .where(eq(s.posts.id, id))
  if (!r) return null
  const viewer = await getViewer()
  if (!r.p.public && viewer?.id !== r.p.authorId) return null
  return toPost(r.p, r.u, true)
}

async function toPost(
  p: typeof s.posts.$inferSelect,
  u: typeof s.users.$inferSelect,
  full: boolean,
): Promise<PostView> {
  const [trips] = await db
    .select({ n: count() })
    .from(s.attendance)
    .where(and(eq(s.attendance.userId, u.id), eq(s.attendance.status, '참여 확인')))
  // 실제 방문 기반 후기: 그 테마에서 체크인했으면 스탬프 표시
  let stamp: string | undefined
  if (p.themeId) {
    const [c] = await db
      .select({ name: s.places.name })
      .from(s.checkins)
      .innerJoin(s.places, eq(s.places.id, s.checkins.placeId))
      .where(and(eq(s.checkins.themeId, p.themeId), eq(s.checkins.userId, u.id)))
    stamp = c?.name
  }
  const [t] = p.themeId ? await db.select().from(s.themes).where(eq(s.themes.id, p.themeId)) : []
  const facts = [
    p.transport,
    t
      ? `${(await db.select({ n: count() }).from(s.themeStops).where(eq(s.themeStops.themeId, t.id)))[0].n}곳`
      : null,
    p.spentWon ? `실제 지출 ${won(p.spentWon)}` : null,
  ].filter((x): x is string => !!x)
  const answers = full
    ? (
        await db
          .select({ c: s.comments, name: s.users.name })
          .from(s.comments)
          .innerJoin(s.users, eq(s.users.id, s.comments.authorId))
          .where(eq(s.comments.postId, p.id))
          .orderBy(asc(s.comments.createdAt))
      ).map((a) => ({ author: a.name, body: a.c.body, when: ago(a.c.createdAt) }))
    : []
  // 다음 날짜를 보여 줄 테마: 같은 핵심 장소의 모집 중 테마
  let nextTheme: string | undefined
  if (t) {
    const [n] = await db
      .select({ id: s.themes.id })
      .from(s.themes)
      .where(
        and(
          eq(s.themes.corePlaceId, t.corePlaceId),
          eq(s.themes.status, '모집 중'),
          gte(s.themes.day, today()),
        ),
      )
      .orderBy(asc(s.themes.day))
      .limit(1)
    nextTheme = n?.id
  }
  return {
    id: p.id,
    kind: p.kind,
    author: u.name,
    authorHandle: u.handle,
    trips: Number(trips?.n ?? 0),
    when:
      p.kind === '질문'
        ? ago(p.createdAt)
        : p.visitedOn
          ? `${parts(p.visitedOn).m}월 ${parts(p.visitedOn).d}일 방문`
          : ago(p.createdAt),
    title: p.title,
    summary: p.body.length > 70 ? `${p.body.slice(0, 68)}…` : p.body,
    body: p.body,
    photos: p.photos.map(photoImg),
    stamp,
    facts: facts.length ? facts : undefined,
    themeId: nextTheme,
    coursePlace: p.allowCopy ? (t?.corePlaceId ?? p.placeId ?? undefined) : undefined,
    courseStops: t
      ? (
          await db
            .select({ id: s.themeStops.placeId })
            .from(s.themeStops)
            .where(eq(s.themeStops.themeId, t.id))
            .orderBy(asc(s.themeStops.ord))
        ).map((x) => x.id)
      : p.placeId
        ? [p.placeId]
        : [],
    answers,
  }
}

/** 이번 주말 열린 테마(커뮤니티 옆) */
export async function openThemes(n = 3) {
  const viewer = await getViewer()
  const list = await loadThemes(db, {
    where: and(eq(s.themes.status, '모집 중'), gte(s.themes.day, today())),
    prefs: viewer?.prefs.activities,
  })
  return list.slice(0, n)
}

/** 후기 쓸 수 있는 내 테마(완료 + 체크인) */
export async function reviewableTheme(userId: string, themeId?: string) {
  const rows = await db
    .select({ id: s.checkins.themeId })
    .from(s.checkins)
    .innerJoin(s.themes, eq(s.themes.id, s.checkins.themeId))
    .where(and(eq(s.checkins.userId, userId), themeId ? eq(s.checkins.themeId, themeId) : undefined))
    .orderBy(desc(s.themes.day))
    .limit(1)
  if (!rows[0]) return null
  return (await loadThemes(db, { ids: [rows[0].id] }))[0] ?? null
}

// ── 호스트 ───────────────────────────────────────────
export async function hostThemes(hostId: string) {
  const t = today()
  const all = await loadThemes(db, { where: eq(s.themes.hostId, hostId) })
  const active = all.filter((x) => (LISTED as readonly string[]).includes(x.status) && x.day >= t)
  return {
    recruiting: active.filter((x) => !x.matched && x.status === '모집 중'),
    matched: active.filter((x) => x.matched || x.status !== '모집 중'),
    past: all.filter((x) => !active.includes(x)).sort((a, b) => b.day.localeCompare(a.day)),
  }
}

/** 신청한 사람 이름 + 동행 기록 요약(호스트 카드) */
export async function applicantsOf(themeId: string) {
  const rows = await db
    .select({ a: s.applications, u: s.users })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .where(
      and(eq(s.applications.themeId, themeId), inArray(s.applications.status, ['신청 대기', '수락', '거절'])),
    )
    .orderBy(asc(s.applications.createdAt))
  return Promise.all(
    rows.map(async ({ a, u }) => {
      const [trips] = await db
        .select({ n: count() })
        .from(s.attendance)
        .where(and(eq(s.attendance.userId, u.id), eq(s.attendance.status, '참여 확인')))
      const tags = await topTags(u.id, 2)
      return {
        id: a.id,
        userId: u.id,
        handle: u.handle,
        name: u.name,
        status: a.status as '신청 대기' | '수락' | '거절',
        party: a.party,
        from: `${u.origin ?? '출발지 미정'} 출발 · ${a.party > 1 ? '친구와 함께 +1' : Number(trips?.n) ? `동행 ${trips.n}회` : '혼자 신청'}`,
        trips: Number(trips?.n ?? 0),
        tags: tags.length ? tags : ['첫 동행이에요'],
        note: a.message || undefined,
      }
    }),
  )
}

/** 받은 행동 태그 많이 받은 순 */
export async function topTags(userId: string, n = 3) {
  const rows = await db
    .select({ tag: sql<string>`unnest(${s.peerReviews.tags})`, n: sql<number>`count(*)::int` })
    .from(s.peerReviews)
    .where(eq(s.peerReviews.toUser, userId))
    .groupBy(sql`1`)
    .orderBy(sql`2 desc`)
  return rows.slice(0, n).map((r) => r.tag)
}

/** 호스트가 볼 테마 요청(넘긴 것 제외, 요청한 사람은 숨김) */
export async function requestsFor(hostId: string) {
  const skipped = await db
    .select({ id: s.requestSkips.requestId })
    .from(s.requestSkips)
    .where(eq(s.requestSkips.hostId, hostId))
  const rows = await db
    .select()
    .from(s.themeRequests)
    .where(
      skipped.length
        ? notInArray(
            s.themeRequests.id,
            skipped.map((x) => x.id),
          )
        : undefined,
    )
    .orderBy(desc(s.themeRequests.same), desc(s.themeRequests.createdAt))
  return rows.map((r) => ({ id: r.id, text: r.body, when: r.when, tags: r.tags, same: r.same }))
}

/** 방문 요약 — 체크인으로만 센다 */
export async function hostSummary(hostId: string, period: 'month' | 'last' | 'all') {
  const t = today()
  const monthStart = `${t.slice(0, 7)}-01`
  const lastStart = `${addDays(monthStart, -1).slice(0, 7)}-01`
  const range =
    period === 'month'
      ? and(gte(s.themes.day, monthStart), lt(s.themes.day, addDays(t, 1)))
      : period === 'last'
        ? and(gte(s.themes.day, lastStart), lt(s.themes.day, monthStart))
        : lt(s.themes.day, addDays(t, 1))
  const themes = await db
    .select()
    .from(s.themes)
    .where(and(eq(s.themes.hostId, hostId), range, inArray(s.themes.status, ['여행 완료', '취소'])))
    .orderBy(desc(s.themes.day))
  const ids = themes.map((x) => x.id)
  const checks = ids.length ? await db.select().from(s.checkins).where(inArray(s.checkins.themeId, ids)) : []
  const stops = ids.length
    ? await db
        .select({ themeId: s.themeStops.themeId, n: count() })
        .from(s.themeStops)
        .where(inArray(s.themeStops.themeId, ids))
        .groupBy(s.themeStops.themeId)
    : []
  const done = themes.filter((x) => x.status === '여행 완료')
  const avgStops = done.length
    ? Math.round(
        done.reduce((n, x) => n + Number(stops.find((y) => y.themeId === x.id)?.n ?? 0), 0) / done.length,
      )
    : 0
  return {
    stats: [
      { value: String(checks.length), unit: '명', label: '내 테마로 온 방문객' },
      { value: String(checks.filter((c) => c.firstVisit).length), unit: '명', label: '남양주 첫 방문' },
      { value: `${done.length} / ${themes.length}`, unit: '', label: '성사된 테마' },
      { value: String(avgStops), unit: '곳', label: '테마당 방문 장소 평균' },
    ],
    rows: themes.map((x) => ({
      id: x.id,
      title: x.title,
      when: dayLabel(x.day),
      cap: x.status === '취소' ? `최소 ${x.min}명` : `${x.max}명 중`,
      visitors: checks.filter((c) => c.themeId === x.id).length,
      status: x.status,
    })),
  }
}

/** 지역 요약(운영팀·지자체용) — 체크인 기준 */
export async function regionSummary(period: 'month' | 'last' | 'all') {
  const t = today()
  const monthStart = `${t.slice(0, 7)}-01`
  const lastStart = `${addDays(monthStart, -1).slice(0, 7)}-01`
  const range =
    period === 'month'
      ? gte(s.checkins.createdAt, new Date(`${monthStart}T00:00:00+09:00`))
      : period === 'last'
        ? and(
            gte(s.checkins.createdAt, new Date(`${lastStart}T00:00:00+09:00`)),
            lt(s.checkins.createdAt, new Date(`${monthStart}T00:00:00+09:00`)),
          )
        : undefined
  const rows = await db
    .select({ c: s.checkins, origin: s.users.origin, area: s.places.area })
    .from(s.checkins)
    .innerJoin(s.users, eq(s.users.id, s.checkins.userId))
    .innerJoin(s.places, eq(s.places.id, s.checkins.placeId))
    .where(range)
  const themeStatus = await db
    .select({ status: s.themes.status, n: count() })
    .from(s.themes)
    .where(
      and(
        inArray(s.themes.status, ['여행 완료', '취소']),
        period === 'all' ? undefined : gte(s.themes.day, period === 'month' ? monthStart : lastStart),
      ),
    )
    .groupBy(s.themes.status)
  const done = Number(themeStatus.find((x) => x.status === '여행 완료')?.n ?? 0)
  const total = themeStatus.reduce((n, x) => n + Number(x.n), 0)
  const perUser = new Map<string, number>()
  for (const r of rows) perUser.set(r.c.userId, (perUser.get(r.c.userId) ?? 0) + 1)
  const tally = (key: (r: (typeof rows)[number]) => string) => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }
  return {
    stats: [
      { value: String(rows.length), unit: '명', label: '외부 방문객' },
      { value: String(rows.filter((r) => r.c.firstVisit).length), unit: '명', label: '남양주 첫 방문' },
      { value: `${done} / ${total}`, unit: '', label: '성사된 테마' },
      { value: String([...perUser.values()].filter((n) => n > 1).length), unit: '명', label: '두 번째 방문' },
    ],
    origin: tally((r) => r.origin ?? '미정'),
    arrive: tally((r) => r.area),
    // 두 개 이상 권역의 스탬프를 가진 참여자(재방문 보조 지표) — 기간과 상관없이 전체 기록
    multiRegion: Number(
      (
        await db.execute<{ n: number }>(
          sql`select count(*)::int as n from (select c.user_id from ${s.checkins} c join ${s.places} p on p.id = c.place_id where p.region is not null group by c.user_id having count(distinct p.region) > 1) x`,
        )
      )[0]?.n ?? 0,
    ),
    months: [Number(t.slice(5, 7)), Number(lastStart.slice(5, 7))],
  }
}

/** 체크인 현황(호스트 QR 화면): 오늘 또는 가장 가까운 성사 테마 */
export async function checkinBoard(hostId: string, themeId?: string) {
  const { matched } = await hostThemes(hostId)
  const t = themeId ? matched.find((x) => x.id === themeId) : matched[0]
  if (!t) return null
  const rows = await db
    .select({ a: s.applications, u: s.users, c: s.checkins })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .leftJoin(
      s.checkins,
      and(eq(s.checkins.themeId, s.applications.themeId), eq(s.checkins.userId, s.applications.userId)),
    )
    .where(and(eq(s.applications.themeId, t.id), eq(s.applications.status, '수락')))
  return {
    theme: t,
    members: rows.map((r) => ({
      userId: r.u.id,
      name: r.u.name,
      at: r.c ? `${hhmm(r.c.createdAt)} 체크인` : '아직 체크인하지 않았어요',
      done: !!r.c,
    })),
  }
}

/** 호스트 평가 화면: 수락된 참여자 + 체크인 여부 */
export async function reviewRows(themeId: string) {
  const rows = await db
    .select({ u: s.users, c: s.checkins, att: s.attendance })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .leftJoin(s.checkins, and(eq(s.checkins.themeId, themeId), eq(s.checkins.userId, s.users.id)))
    .leftJoin(s.attendance, and(eq(s.attendance.themeId, themeId), eq(s.attendance.userId, s.users.id)))
    .where(and(eq(s.applications.themeId, themeId), eq(s.applications.status, '수락')))
  return Promise.all(
    rows.map(async (r) => {
      const [trips] = await db
        .select({ n: count() })
        .from(s.attendance)
        .where(and(eq(s.attendance.userId, r.u.id), eq(s.attendance.status, '참여 확인')))
      return {
        id: r.u.id,
        name: r.u.name,
        checked: !!r.c,
        first: Number(trips?.n ?? 0) <= 1,
        attendance: r.att?.status,
      }
    }),
  )
}

/** 일정 편집(호스트) — 제안 목록 */
export async function changesOf(themeId: string) {
  const rows = await db
    .select({ c: s.changes, name: s.users.name })
    .from(s.changes)
    .innerJoin(s.users, eq(s.users.id, s.changes.proposerId))
    .where(eq(s.changes.themeId, themeId))
    .orderBy(desc(s.changes.createdAt))
  const confirms = rows.length
    ? await db
        .select({ changeId: s.changeConfirms.changeId, n: count() })
        .from(s.changeConfirms)
        .where(
          inArray(
            s.changeConfirms.changeId,
            rows.map((r) => r.c.id),
          ),
        )
        .groupBy(s.changeConfirms.changeId)
    : []
  return rows.map((r) => ({
    ...r.c,
    who: r.name,
    confirmed: Number(confirms.find((x) => x.changeId === r.c.id)?.n ?? 0),
  }))
}

export const whenOf = (d: Date) => ago(d)
