// 스탬프북 읽기 — 지역·계절 스탬프, 장소별 방문, 지역 테마. 핵심 장소에서 체크인하면 스탬프가 찍힌다.
import 'server-only'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import type { AnyDb } from '@/lib/server/domain/types'
import { isSubscribed } from '@/lib/server/queries/profiles'
import { loadThemes } from '@/lib/server/queries/theme-view'
import { dayLabel, parts, today } from '@/lib/server/util/time'
import type { Cell } from '@/lib/shared/stamps'

// ── 스탬프북 설정 ─────────────────────────────────────
export const REGIONS = [
  { id: 'paldang', name: '팔당·조안 수변' },
  { id: 'dasan', name: '다산·정약용 문화권' },
  { id: 'gwangneung', name: '광릉·진접 숲' },
  { id: 'byeollae', name: '별내' },
  { id: 'hwado', name: '화도·수동 계곡' },
  { id: 'city', name: '남양주 시내' },
] as const
const regionName = (id: string | null | undefined) => REGIONS.find((r) => r.id === id)?.name ?? ''

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
function seasonsFor(todayIso: string) {
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
export const md = (day: string) => `${parts(day).m}.${parts(day).d}`
export const mdKo = (at: Date) => {
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
