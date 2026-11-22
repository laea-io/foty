// 그룹 A(가입·마이·공통) 읽기. 모두 db를 첫 인자로 받는다 — 페이지는 '@/lib/db'의 db를, 시험은 PGlite를 넘긴다.
import 'server-only'
import { and, asc, desc, eq, gte, inArray, lte, ne, or, sql } from 'drizzle-orm'
import type { BadgeTone } from '@/components/ui/primitives'
import * as s from '@/lib/db/schema'
import type { Cell } from '@/lib/demo/stamps'
import { loadThemes, type ThemeView } from '../domain/read'
import type { AnyDb } from '../domain/types'
import { rules } from '../rules'
import { ago, dayLabel, hhmm, parts, today } from '../time'

/** 목록에 보이는 상태(q/themes.ts의 LISTED와 같다 — 그 모듈은 운영 db를 불러와서 여기서는 따로 둔다) */
export const LISTED = ['모집 중', '모집 마감', '일정 조율 중', '일정 확정'] as const
const MATCHED_STATUS = ['일정 조율 중', '일정 확정', '여행 완료'] as const

// ── 스탬프북 설정 ─────────────────────────────────────
export const REGIONS = [
  { id: 'paldang', name: '팔당·조안 수변' },
  { id: 'dasan', name: '다산·정약용 문화권' },
  { id: 'gwangneung', name: '광릉·진접 숲' },
  { id: 'byeollae', name: '별내' },
  { id: 'hwado', name: '화도·수동 계곡' },
  { id: 'city', name: '남양주 시내' },
] as const
export const regionName = (id: string | null | undefined) => REGIONS.find((r) => r.id === id)?.name ?? ''

/** 계절 시리즈 — 그 기간에 체크인한 장소가 채워진다. 칸은 실제 장소(관광공사 id) + 시안 장소(스테이징)이고,
 *  DB에 있는 장소만 보인다. 지금 계절과 다음 계절 두 개를 날짜로 계산한다 */
const SEASON_CELLS: Record<'봄' | '여름' | '가을' | '겨울', [place: string, name: string][]> = {
  봄: [
    ['tour-2602619', '봄 물의 정원'],
    ['tour-2500687', '봄 다산생태공원'],
    ['tour-126539', '봄 봉선사'],
    ['tour-2633910', '봄 물맑음수목원'],
    ['tour-125453', '봄 천마산'],
    ['water-garden', '봄 물의정원'],
  ],
  여름: [
    ['tour-2765241', '여름 묘적사계곡'],
    ['tour-127818', '여름 축령산 숲'],
    ['tour-3007678', '여름 밤섬유원지'],
    ['tour-3013790', '여름 팔당유원지'],
    ['tour-125458', '여름 운길산'],
    ['gwangneung', '여름 광릉숲'],
  ],
  가을: [
    ['tour-129516', '가을 수종사'],
    ['tour-2602619', '가을 물의 정원'],
    ['tour-125546', '가을 광릉'],
    ['tour-127818', '가을 축령산'],
    ['tour-2765241', '가을 묘적사계곡'],
    ['dumulmeori', '가을 두물머리'],
    ['water-garden', '가을 물의정원'],
    ['gwangneung', '가을 광릉숲'],
    ['sujongsa', '가을 수종사'],
  ],
  겨울: [
    ['tour-129516', '겨울 수종사'],
    ['tour-3012162', '겨울 실학박물관'],
    ['tour-1936797', '겨울 남양주시립박물관'],
    ['tour-2773766', '겨울 한강뮤지엄'],
    ['tour-126806', '겨울 정약용유적지'],
    ['sujongsa', '겨울 찻집'],
    ['dasan-hanjeongsik', '겨울 한 상'],
  ],
}

const pad = (n: number) => String(n).padStart(2, '0')
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()

/** 날짜가 속한 계절과 그다음 계절(가을 9~11월, 겨울 12~2월, 봄 3~5월, 여름 6~8월) */
export function seasonsFor(todayIso: string) {
  const [y, m] = todayIso.split('-').map(Number)
  const order = ['겨울', '봄', '여름', '가을'] as const
  // 계절 시작 달: 겨울 12, 봄 3, 여름 6, 가을 9. 1·2월은 전년도 겨울
  const startMonth = m === 12 || m <= 2 ? 12 : m <= 5 ? 3 : m <= 8 ? 6 : 9
  const startYear = m <= 2 ? y - 1 : y
  const make = (sy: number, sm: number) => {
    const name = order[sm === 12 ? 0 : sm / 3] as keyof typeof SEASON_CELLS
    const ey = sm === 12 ? sy + 1 : sy
    const em = sm === 12 ? 2 : sm + 2
    const label = sm === 12 ? `${sy}–${String(ey).slice(2)} 겨울` : `${sy} ${name}`
    return {
      name: label,
      from: `${sy}-${pad(sm)}-01`,
      to: `${ey}-${pad(em)}-${pad(lastDay(ey, em))}`,
      cells: SEASON_CELLS[name],
    }
  }
  const next = startMonth === 12 ? [startYear + 1, 3] : [startYear, startMonth + 3]
  return [make(startYear, startMonth), make(next[0], next[1])]
}

/** 'YYYY-MM-DD' 둘 중 늦은 날 */
function laterDay(a: string, b: string) {
  if (a > b) return a
  return b
}
const md = (day: string) => `${parts(day).m}.${parts(day).d}`
const mdKo = (at: Date) => {
  const p = parts(today(at))
  return `${p.m}월 ${p.d}일`
}

// ── 공통 조각 ─────────────────────────────────────────
type Visit = { placeId: string; themeId: string; title: string; day: string }

/** 내 체크인(테마 날짜 기준, 최근 먼저) */
async function visitsOf(db: AnyDb, userId: string): Promise<Visit[]> {
  return db
    .select({
      placeId: s.checkins.placeId,
      themeId: s.checkins.themeId,
      title: s.themes.title,
      day: s.themes.day,
    })
    .from(s.checkins)
    .innerJoin(s.themes, eq(s.themes.id, s.checkins.themeId))
    .where(eq(s.checkins.userId, userId))
    .orderBy(desc(s.themes.day))
}

/** 장소별 방문(같은 날 같은 장소는 한 번) */
function visitStats(visits: Visit[], from?: string, to?: string) {
  const m = new Map<string, { days: Set<string>; last: string }>()
  for (const v of visits) {
    if ((from && v.day < from) || (to && v.day > to)) continue
    const cur = m.get(v.placeId) ?? { days: new Set<string>(), last: v.day }
    cur.days.add(v.day)
    if (v.day > cur.last) cur.last = v.day
    m.set(v.placeId, cur)
  }
  return m
}

/** 모집 중(오늘 이후) 테마: 장소 id → 테마 id들(핵심 장소 또는 코스에 그 장소가 있는 테마) */
async function recruitingByPlace(db: AnyDb, from: string, to?: string) {
  const conds = [eq(s.themes.status, '모집 중'), gte(s.themes.day, from)]
  if (to) conds.push(lte(s.themes.day, to))
  const ts = await db
    .select({ id: s.themes.id, core: s.themes.corePlaceId })
    .from(s.themes)
    .where(and(...conds))
  const map = new Map<string, Set<string>>()
  const add = (place: string, theme: string) => {
    const set = map.get(place) ?? new Set<string>()
    set.add(theme)
    map.set(place, set)
  }
  for (const t of ts) add(t.core, t.id)
  if (ts.length) {
    const stops = await db
      .select({ themeId: s.themeStops.themeId, placeId: s.themeStops.placeId })
      .from(s.themeStops)
      .where(
        inArray(
          s.themeStops.themeId,
          ts.map((t) => t.id),
        ),
      )
    for (const st of stops) add(st.placeId, st.themeId)
  }
  return map
}

type PlaceRow = typeof s.places.$inferSelect
const cellName = (p: PlaceRow) => p.short ?? p.name

function makeCell(
  p: PlaceRow,
  stat: { days: Set<string>; last: string } | undefined,
  recruiting: Set<string> | undefined,
  name = cellName(p),
): Cell & { visits: number; open: number } {
  if (stat?.days.size)
    return {
      id: p.id,
      name,
      got: true,
      caption: `${stat.days.size}회 · ${md(stat.last)}`,
      href: `/my/stamps/${p.id}`,
      visits: stat.days.size,
      open: 0,
    }
  const n = recruiting?.size ?? 0
  return {
    id: p.id,
    name,
    got: false,
    caption: n ? `모집 중 ${n}` : '테마 없음',
    live: n > 0,
    href: `/my/stamps/region/${p.region ?? 'paldang'}?place=${p.id}`,
    visits: 0,
    open: n,
  }
}

const cellOrder = (a: { visits: number; open: number; name: string }, b: typeof a) =>
  b.visits - a.visits || b.open - a.open || a.name.localeCompare(b.name, 'ko')

// ── 스탬프북 ─────────────────────────────────────────
export async function stampbook(db: AnyDb, userId: string, now = new Date()) {
  const t = today(now)
  const [places, visits, rec] = await Promise.all([
    db.select().from(s.places).where(eq(s.places.stamp, true)),
    visitsOf(db, userId),
    recruitingByPlace(db, t),
  ])
  const stats = visitStats(visits)
  const cells = places.map((p) => ({ p, c: makeCell(p, stats.get(p.id), rec.get(p.id)) }))
  const groups = REGIONS.map((r) => {
    const mine = cells
      .filter((x) => x.p.region === r.id)
      .map((x) => x.c)
      .sort(cellOrder)
    return { region: r, got: mine.filter((c) => c.got).length, total: mine.length, cells: mine }
  }).filter((g) => g.total > 0)
  const stampCount = groups.reduce((n, g) => n + g.got, 0)
  const regionCount = groups.filter((g) => g.got > 0).length
  const row = cells
    .map((x) => x.c)
    .sort(cellOrder)
    .slice(0, 5)
  return { groups, stampCount, regionCount, row }
}

/** 계절 시리즈 */
export async function seasonSeries(db: AnyDb, userId: string, now = new Date()) {
  const t = today(now)
  const ids = [...new Set(seasonsFor(t).flatMap((x) => x.cells.map(([p]) => p)))]
  const [places, visits] = await Promise.all([
    db.select().from(s.places).where(inArray(s.places.id, ids)),
    visitsOf(db, userId),
  ])
  const out = []
  for (const season of seasonsFor(t)) {
    const stats = visitStats(visits, season.from, season.to)
    const rec = await recruitingByPlace(db, laterDay(t, season.from), season.to)
    const cells = season.cells.flatMap(([id, name]) => {
      const p = places.find((x) => x.id === id)
      return p ? [makeCell(p, stats.get(id), rec.get(id), name)] : []
    })
    const got = cells.filter((c) => c.got).length
    const notYet = t < season.from
    const over = t > season.to
    const end = parts(season.to)
    out.push({
      name: season.name,
      closed: notYet || over,
      aside: notYet
        ? `${parts(season.from).m}월에 열려요`
        : `${got} / ${cells.length} · ${over ? '끝났어요' : `${end.m}월 ${end.d}일까지`}`,
      cells,
    })
  }
  return out
}

/** 스탬프 하나(받은 칸만) */
export async function stampPlace(db: AnyDb, userId: string, placeId: string) {
  const [p] = await db.select().from(s.places).where(eq(s.places.id, placeId))
  if (!p) return null
  const visits = (await visitsOf(db, userId)).filter((v) => v.placeId === placeId)
  if (!visits.length) return null
  const days = new Set(visits.map((v) => v.day))
  return {
    id: p.id,
    name: cellName(p),
    region: p.region ?? '',
    regionName: regionName(p.region),
    visits: days.size,
    image: { src: p.image, alt: p.imageAlt, bg: p.imageBg },
    records: visits.map((v) => ({ title: v.title, date: dayLabel(v.day), themeId: v.themeId })),
  }
}

/** 권역(또는 권역 안 빈 칸 하나)에서 모집 중인 테마 */
export async function regionThemes(
  db: AnyDb,
  regionId: string,
  placeId: string | undefined,
  userId: string | undefined,
  now = new Date(),
) {
  const region = REGIONS.find((r) => r.id === regionId)
  if (!region) return null
  const inRegion = await db.select().from(s.places).where(eq(s.places.region, region.id))
  const place = placeId ? inRegion.find((p) => p.id === placeId) : undefined
  if (placeId && !place) return null
  const rec = await recruitingByPlace(db, today(now))
  const ids = new Set<string>()
  for (const p of place ? [place] : inRegion) for (const id of rec.get(p.id) ?? []) ids.add(id)
  const list = ids.size ? await loadThemes(db, { ids: [...ids] }) : []
  list.sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start))
  let hasStamp = false
  let subscribed = false
  const subKey = place ? place.id : `region:${region.id}`
  if (userId) {
    const stampIds = new Set(inRegion.filter((p) => p.stamp).map((p) => p.id))
    hasStamp = (await visitsOf(db, userId)).some((v) => stampIds.has(v.placeId))
    subscribed = await isSubscribed(db, userId, 'place', subKey)
  }
  return {
    region,
    place: place ? { id: place.id, name: cellName(place) } : undefined,
    list,
    hasStamp,
    subscribed,
    subKey,
  }
}

// ── 마이 ─────────────────────────────────────────────
/** 여행 성향 칩(관심 활동 → 속도 → 걷기 → 대화 → 계획 → 식사) */
export function tasteOf(prefs: s.Prefs) {
  const walk = prefs.walk ? (prefs.walk.includes('걸') ? prefs.walk : `${prefs.walk} 걷기`) : undefined
  return [...(prefs.activities ?? []), prefs.pace, walk, prefs.talk, prefs.plan, prefs.food].filter(
    (x): x is string => !!x,
  )
}

/** 받은 행동 태그(횟수만) */
export async function tagCounts(db: AnyDb, userId: string): Promise<[string, number][]> {
  const rows = await db
    .select({ tags: s.peerReviews.tags })
    .from(s.peerReviews)
    .where(eq(s.peerReviews.toUser, userId))
  const m = new Map<string, number>()
  for (const r of rows) for (const t of r.tags) m.set(t, (m.get(t) ?? 0) + 1)
  const order = (t: string) => {
    const i = rules.behaviorTags.indexOf(t)
    return i < 0 ? 99 : i
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || order(a[0]) - order(b[0]))
}

/** 참여 확인된 동행 횟수 */
export async function tripCount(db: AnyDb, userId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.attendance)
    .where(and(eq(s.attendance.userId, userId), eq(s.attendance.status, '참여 확인')))
  return Number(r?.n ?? 0)
}

export async function myPage(db: AnyDb, userId: string, now = new Date()) {
  const t = today(now)
  const [trips, tags, book, apps] = await Promise.all([
    tripCount(db, userId),
    tagCounts(db, userId),
    stampbook(db, userId, now),
    db
      .select({ status: s.applications.status })
      .from(s.applications)
      .innerJoin(s.themes, eq(s.themes.id, s.applications.themeId))
      .where(
        and(
          eq(s.applications.userId, userId),
          inArray(s.applications.status, ['수락', '신청 대기']),
          inArray(s.themes.status, [...LISTED]),
          gte(s.themes.day, t),
        ),
      ),
  ])
  return {
    trips,
    tags,
    upcoming: apps.filter((a) => a.status === '수락').length,
    applying: apps.filter((a) => a.status === '신청 대기').length,
    stampCount: book.stampCount,
    row: book.row,
  }
}

// ── 알림 ─────────────────────────────────────────────
export async function notificationsOf(db: AnyDb, userId: string, now = new Date()) {
  const rows = await db
    .select()
    .from(s.notifications)
    .where(eq(s.notifications.userId, userId))
    .orderBy(desc(s.notifications.createdAt))
    .limit(50)
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    unread: !n.readAt,
    when: ago(n.createdAt, now),
  }))
}

// ── 검색 ─────────────────────────────────────────────
const like = (k: string) => `%${k.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

/** 테마(제목·핵심 장소, 목록 상태, 오늘 이후) · 코스 장소(이름) · 공개 글(제목·본문) */
export async function searchAll(db: AnyDb, q: string, opts: { prefs?: string[]; now?: Date } = {}) {
  const k = q.replace(/\s+/g, '').toLowerCase()
  const t = today(opts.now)
  const norm = (col: unknown) => sql`replace(lower(${col}), ' ', '')`
  const listed = and(inArray(s.themes.status, [...LISTED]), gte(s.themes.day, t))
  let themeIds: string[] | undefined
  if (k) {
    const rows = await db
      .select({ id: s.themes.id })
      .from(s.themes)
      .innerJoin(s.places, eq(s.places.id, s.themes.corePlaceId))
      .where(
        and(
          listed,
          or(sql`${norm(s.themes.title)} like ${like(k)}`, sql`${norm(s.places.name)} like ${like(k)}`),
        ),
      )
    themeIds = rows.map((r) => r.id)
  }
  const themes: ThemeView[] =
    themeIds && !themeIds.length
      ? []
      : await loadThemes(db, { where: themeIds ? inArray(s.themes.id, themeIds) : listed, prefs: opts.prefs })
  const [places] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.places)
    .where(
      k
        ? or(
            sql`${norm(s.places.name)} like ${like(k)}`,
            sql`${norm(sql`coalesce(${s.places.short}, '')`)} like ${like(k)}`,
          )
        : undefined,
    )
  const [posts] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.posts)
    .where(
      and(
        eq(s.posts.public, true),
        k
          ? or(sql`${norm(s.posts.title)} like ${like(k)}`, sql`${norm(s.posts.body)} like ${like(k)}`)
          : undefined,
      ),
    )
  return { themes, courses: Number(places?.n ?? 0), reviews: Number(posts?.n ?? 0) }
}

// ── 신고 ─────────────────────────────────────────────
export type ReportTarget = {
  name: string
  line: string
  person: boolean
  back: string
  userId: string | null
  handle: string | null
  themeId: string | null
}

/** ?user=<handle> · ?theme=<id> (둘 다면 그 테마 안의 사람). 둘 다 없으면 운영팀에 보내는 내용 */
export async function reportTarget(
  db: AnyDb,
  q: { user?: string; theme?: string },
): Promise<ReportTarget | null> {
  const [u] = q.user ? await db.select().from(s.users).where(eq(s.users.handle, q.user)) : []
  if (q.user && !u) return null
  const [th] = q.theme
    ? await db
        .select({ id: s.themes.id, title: s.themes.title, host: s.hosts.name })
        .from(s.themes)
        .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
        .where(eq(s.themes.id, q.theme))
    : []
  if (q.theme && !th) return null
  if (u)
    return {
      name: u.name,
      line: th ? `${th.title} 참여자` : u.origin ? `${u.origin} 출발` : '참여자',
      person: true,
      back: th ? `/trips/${th.id}/members` : `/users/${u.handle}`,
      userId: u.id,
      handle: u.handle,
      themeId: th?.id ?? null,
    }
  if (th)
    return {
      name: th.title,
      line: `${th.host} 호스트의 테마`,
      person: false,
      back: `/themes/${th.id}`,
      userId: null,
      handle: null,
      themeId: th.id,
    }
  return {
    name: '운영팀',
    line: '추가 내용 · 이의제기',
    person: false,
    back: '/my/blocks',
    userId: null,
    handle: null,
    themeId: null,
  }
}

// ── 신고·차단 내역 ───────────────────────────────────
export const reportBadge = (st: (typeof s.reportStatus.enumValues)[number]): [BadgeTone, string] =>
  st === '검토 중'
    ? ['soft', '관리자 확인 중']
    : st === '처리 완료'
      ? ['ink', '처리 완료']
      : ['muted', '반려']

export async function blocksAndReports(db: AnyDb, userId: string) {
  const [blocks, reports] = await Promise.all([
    db
      .select({ id: s.users.id, name: s.users.name, handle: s.users.handle, at: s.blocks.createdAt })
      .from(s.blocks)
      .innerJoin(s.users, eq(s.users.id, s.blocks.blockedId))
      .where(eq(s.blocks.userId, userId))
      .orderBy(desc(s.blocks.createdAt)),
    db.select().from(s.reports).where(eq(s.reports.reporterId, userId)).orderBy(desc(s.reports.createdAt)),
  ])
  return {
    blocks: blocks.map((b) => ({ ...b, when: `${mdKo(b.at)} 차단` })),
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      badge: reportBadge(r.status),
      when: `${mdKo(r.createdAt)} 접수`,
    })),
  }
}

// ── 운영팀 ───────────────────────────────────────────
export type AdminHost = {
  id: string
  name: string
  line: string
  badge: [BadgeTone, string]
  pending: boolean
  /** 확인 완료면 정지할 수 있고, 정지면 해제할 수 있다 */
  status: (typeof s.hostStatus.enumValues)[number]
  themes: number
  kind: string
  area: string
  intro: string
  contact: string
  /** 11.21 14:05 제출 */
  submitted: string
}
export type AdminReport = {
  id: string
  name: string
  line: string
  badge: [BadgeTone, string]
  open: boolean
  /** 처리 버튼 글자(불참 신고는 "불참 확인") */
  doneLabel: string
  href: string
  /** 신고한 사람·대상 바로 가기 */
  links: { href: string; label: string }[]
}

const stamp = (at: Date) => `${mdKo(at)} ${hhmm(at)}`

export async function adminQueue(db: AnyDb) {
  const hosts = await db.select().from(s.hosts).orderBy(asc(s.hosts.submittedAt))
  const counts = await db
    .select({ hostId: s.themes.hostId, n: sql<number>`count(*)::int` })
    .from(s.themes)
    .groupBy(s.themes.hostId)
  const kindLabel = (k: string) => (k === 'business' ? '가게' : '주민')
  const verified = (k: string): [BadgeTone, string] => ['ink', k === 'business' ? '사업장 확인' : '주민 인증']
  const toRow = (h: typeof s.hosts.$inferSelect): AdminHost => ({
    id: h.id,
    name: h.name,
    line: `${kindLabel(h.kind)} · ${h.area}${h.status === '확인 완료' ? '' : ` · ${md(today(h.submittedAt))} 제출`}`,
    badge:
      h.status === '확인 완료'
        ? verified(h.kind)
        : h.status === '확인 대기'
          ? ['warn', '확인 대기']
          : ['muted', h.status],
    pending: h.status === '확인 대기' || h.status === '보류',
    status: h.status,
    themes: Number(counts.find((c) => c.hostId === h.id)?.n ?? 0),
    kind: h.kind === 'business' ? '가게·관광지(사업장)' : '남양주 주민',
    area: h.area,
    intro: h.intro,
    contact: h.contact,
    submitted: stamp(h.submittedAt),
  })
  const open = hosts.filter((h) => h.status === '확인 대기' || h.status === '보류').map(toRow)
  const done = hosts
    .filter((h) => h.status === '확인 완료')
    .sort((a, b) => (b.verifiedAt?.getTime() ?? 0) - (a.verifiedAt?.getTime() ?? 0))
    .map(toRow)
  const stopped = hosts.filter((h) => h.status === '정지').map(toRow)

  // 검토 중인 신고는 오래돼도 전부, 끝난 신고는 최근 20개만
  const reportRows = (open: boolean) =>
    db
      .select({ r: s.reports, user: s.users, theme: s.themes })
      .from(s.reports)
      .leftJoin(s.users, eq(s.users.id, s.reports.targetUserId))
      .leftJoin(s.themes, eq(s.themes.id, s.reports.targetThemeId))
      .where(open ? eq(s.reports.status, '검토 중') : ne(s.reports.status, '검토 중'))
      .orderBy(desc(s.reports.createdAt))
      .limit(open ? 500 : 20)
  const [openReps, closedReps] = await Promise.all([reportRows(true), reportRows(false)])
  const reporterIds = [...new Set([...openReps, ...closedReps].map((x) => x.r.reporterId))]
  const reporters = reporterIds.length
    ? await db
        .select({ id: s.users.id, name: s.users.name, handle: s.users.handle })
        .from(s.users)
        .where(inArray(s.users.id, reporterIds))
    : []
  const reports: AdminReport[] = [...openReps, ...closedReps].map(({ r, user, theme }) => {
    const by = reporters.find((x) => x.id === r.reporterId)
    const links = [
      user ? { href: `/users/${user.handle}`, label: `대상 ${user.name}` } : null,
      theme ? { href: `/themes/${theme.id}`, label: `테마 ${theme.title}` } : null,
      by ? { href: `/users/${by.handle}`, label: `신고한 사람 ${by.name}` } : null,
    ].filter((x): x is { href: string; label: string } => !!x)
    return {
      id: r.id,
      name: user?.name ?? theme?.title ?? '운영팀 문의',
      line: [r.reason, `${md(today(r.createdAt))} 접수`, r.detail || null, user && theme ? theme.title : null]
        .filter(Boolean)
        .join(' · '),
      badge: (r.status === '검토 중'
        ? ['warn', '검토 중']
        : r.status === '처리 완료'
          ? ['soft', '처리 완료']
          : ['muted', '반려']) as [BadgeTone, string],
      open: r.status === '검토 중',
      doneLabel: r.reason === '약속 시간 불참' ? '불참 확인' : '처리 완료',
      href: user ? `/users/${user.handle}` : theme ? `/themes/${theme.id}` : '/admin',
      links,
    }
  })
  return {
    hosts: [...open, ...done, ...stopped],
    openHosts: open.filter((h) => h.badge[1] === '확인 대기').length,
    reports,
    openReports: reports.filter((r) => r.open).length,
  }
}

export type AdminUser = {
  id: string
  handle: string
  name: string
  email: string | null
  role: string
  kakao: boolean
  created: string
  suspended: boolean
  deleted: boolean
}

/** 사용자 찾기(handle·이름·이메일). 검색어가 없으면 최근 가입 30명 */
export async function adminUsers(db: AnyDb, q = ''): Promise<AdminUser[]> {
  const k = q.trim().toLowerCase()
  const rows = await db
    .select()
    .from(s.users)
    .where(
      k
        ? or(
            sql`lower(${s.users.handle}) like ${like(k)}`,
            sql`lower(${s.users.name}) like ${like(k)}`,
            sql`lower(coalesce(${s.users.email}, '')) like ${like(k)}`,
          )
        : undefined,
    )
    .orderBy(desc(s.users.createdAt))
    .limit(k ? 50 : 30)
  return rows.map((u) => ({
    id: u.id,
    handle: u.handle,
    name: u.name,
    email: u.email,
    role: u.role,
    kakao: !!u.kakaoId,
    created: mdKo(u.createdAt),
    suspended: !!u.suspendedAt,
    deleted: u.handle.startsWith('deleted-'),
  }))
}

export type AdminPost = {
  id: string
  title: string
  kind: string
  author: string
  when: string
  hidden: boolean
  comments: { id: string; author: string; body: string; when: string; hidden: boolean }[]
}

/** 커뮤니티 관리: 최근 글 20개 + 각 글의 댓글(숨긴 것 포함) */
export async function adminPosts(db: AnyDb, now = new Date()): Promise<AdminPost[]> {
  const rows = await db
    .select({ p: s.posts, author: s.users.name })
    .from(s.posts)
    .innerJoin(s.users, eq(s.users.id, s.posts.authorId))
    .orderBy(desc(s.posts.createdAt))
    .limit(20)
  const ids = rows.map((r) => r.p.id)
  const cs = ids.length
    ? await db
        .select({ c: s.comments, author: s.users.name })
        .from(s.comments)
        .innerJoin(s.users, eq(s.users.id, s.comments.authorId))
        .where(inArray(s.comments.postId, ids))
        .orderBy(asc(s.comments.createdAt))
    : []
  return rows.map(({ p, author }) => ({
    id: p.id,
    title: p.title,
    kind: p.kind,
    author,
    when: ago(p.createdAt, now),
    hidden: !!p.hiddenAt,
    comments: cs
      .filter((x) => x.c.postId === p.id)
      .map((x) => ({
        id: x.c.id,
        author: x.author,
        body: x.c.body,
        when: ago(x.c.createdAt, now),
        hidden: !!x.c.hiddenAt,
      })),
  }))
}

/** 운영팀이 취소할 수 있는 테마: 아직 끝나지 않은 앞으로의 테마 */
export async function adminThemes(db: AnyDb, now = new Date()) {
  const rows = await db
    .select({ t: s.themes, host: s.hosts.name })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(and(inArray(s.themes.status, [...LISTED]), gte(s.themes.day, today(now))))
    .orderBy(asc(s.themes.day))
    .limit(40)
  return rows.map(({ t, host }) => ({
    id: t.id,
    title: t.title,
    line: `${dayLabel(t.day)} · ${host} · ${t.status}`,
  }))
}

/** 참여 기록 검토 중(호스트 확인과 체크인이 어긋난 것) */
export async function adminAttendance(db: AnyDb) {
  const rows = await db
    .select({
      a: s.attendance,
      title: s.themes.title,
      day: s.themes.day,
      name: s.users.name,
      handle: s.users.handle,
    })
    .from(s.attendance)
    .innerJoin(s.themes, eq(s.themes.id, s.attendance.themeId))
    .innerJoin(s.users, eq(s.users.id, s.attendance.userId))
    .where(eq(s.attendance.status, '검토 중'))
    .orderBy(asc(s.attendance.updatedAt))
  return rows.map((r) => ({
    themeId: r.a.themeId,
    userId: r.a.userId,
    title: r.title,
    name: r.name,
    handle: r.handle,
    line: [dayLabel(r.day), r.a.note].filter(Boolean).join(' · '),
  }))
}

// ── 프로필 ───────────────────────────────────────────
export async function isSubscribed(db: AnyDb, userId: string, kind: string, key: string) {
  const [r] = await db
    .select({ k: s.subscriptions.kind })
    .from(s.subscriptions)
    .where(
      and(eq(s.subscriptions.userId, userId), eq(s.subscriptions.kind, kind), eq(s.subscriptions.key, key)),
    )
  return !!r
}

export async function isBlocked(db: AnyDb, userId: string, blockedId: string) {
  const [r] = await db
    .select({ u: s.blocks.userId })
    .from(s.blocks)
    .where(and(eq(s.blocks.userId, userId), eq(s.blocks.blockedId, blockedId)))
  return !!r
}

/** 사람이 함께한(수락됐거나 호스트인) 테마 id */
async function themesOf(db: AnyDb, userId: string) {
  const [apps, hosted] = await Promise.all([
    db
      .select({ id: s.applications.themeId })
      .from(s.applications)
      .where(and(eq(s.applications.userId, userId), eq(s.applications.status, '수락'))),
    db
      .select({ id: s.themes.id })
      .from(s.themes)
      .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
      .where(eq(s.hosts.userId, userId)),
  ])
  return new Set([...apps, ...hosted].map((r) => r.id))
}

/** 두 사람이 함께 있는 성사된 테마(가까운 날 먼저). 프로필 공개 범위의 근거 */
export async function sharedMatchedThemes(db: AnyDb, a: string, b: string) {
  const [x, y] = await Promise.all([themesOf(db, a), themesOf(db, b)])
  const both = [...x].filter((id) => y.has(id))
  if (!both.length) return []
  const list = await loadThemes(db, { ids: both })
  return list
    .filter(
      (t) => t.status !== '취소' && (t.matched || (MATCHED_STATUS as readonly string[]).includes(t.status)),
    )
    .sort((p, q) => q.day.localeCompare(p.day))
}

export async function userProfile(db: AnyDb, handle: string, viewer: { id: string; role: string } | null) {
  const [u] = await db.select().from(s.users).where(eq(s.users.handle, handle))
  if (!u) return null
  const self = viewer?.id === u.id
  const shared = viewer && !self ? await sharedMatchedThemes(db, viewer.id, u.id) : []
  const allowed = self || viewer?.role === 'admin' || shared.length > 0
  if (!allowed) return { allowed: false as const, name: u.name }
  const showTrips = self || u.privacy.tripsPublic !== false
  const [trips, tags, blocked] = await Promise.all([
    showTrips ? tripCount(db, u.id) : 0,
    showTrips ? tagCounts(db, u.id) : [],
    viewer && !self ? isBlocked(db, viewer.id, u.id) : false,
  ])
  const taste = tasteOf(u.prefs)
  if (u.mbti && u.mbti !== '?' && (u.mbtiPublic || self)) taste.push(u.mbti)
  return {
    allowed: true as const,
    id: u.id,
    handle: u.handle,
    name: u.name,
    self,
    origin: self || u.privacy.profilePublic !== false ? u.origin : null,
    showTrips,
    trips,
    tags,
    taste,
    blocked,
    back: shared[0] ? `/trips/${shared[0].id}/members` : '/',
  }
}

export async function hostProfile(
  db: AnyDb,
  hostId: string,
  viewer: { id: string; role: string } | null,
  now = new Date(),
) {
  const [row] = await db
    .select({ h: s.hosts, u: s.users })
    .from(s.hosts)
    .innerJoin(s.users, eq(s.users.id, s.hosts.userId))
    .where(eq(s.hosts.id, hostId))
  if (!row) return null
  const { h, u } = row
  if (h.status !== '확인 완료' && viewer?.id !== h.userId && viewer?.role !== 'admin') return null
  const t = today(now)
  const [list, [done], [open], tags, subscribed] = await Promise.all([
    loadThemes(db, {
      where: and(eq(s.themes.hostId, h.id), inArray(s.themes.status, [...LISTED]), gte(s.themes.day, t)),
    }),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.themes)
      .where(and(eq(s.themes.hostId, h.id), eq(s.themes.status, '여행 완료'))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.themes)
      .where(and(eq(s.themes.hostId, h.id), eq(s.themes.status, '모집 중'), gte(s.themes.day, t))),
    tagCounts(db, h.userId),
    viewer ? isSubscribed(db, viewer.id, 'host', h.id) : false,
  ])
  return {
    id: h.id,
    name: h.name,
    kind: h.kind,
    intro: h.intro,
    handle: u.handle,
    hosted: Number(done?.n ?? 0),
    open: Number(open?.n ?? 0),
    tags,
    list,
    subscribed,
    self: viewer?.id === h.userId,
  }
}
