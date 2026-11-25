// 장소·코스 읽기 — 핵심 장소 고르기, 장소 찾기, 코스 만들기, 저장한 코스.
import 'server-only'
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { db, schema as s } from '@/lib/db'
import { getViewer } from '@/lib/server/auth/session'
import { draftCourse } from '@/lib/server/domain/suggest'
import { img } from '@/lib/server/queries/host'
import { loadThemes, type ThemeView } from '@/lib/server/queries/theme-view'
import { addDays, dayLabel, parts, today, won } from '@/lib/server/util/time'
import type { Img } from '@/lib/shared/theme'

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

/** 코스 찾기(?q=): 이름·지역·종류에 검색어가 들어간 핵심 장소 */
export async function searchPlaces(q: string): Promise<PlaceItem[]> {
  const k = q.replace(/\s+/g, '').toLowerCase()
  if (!k) return []
  const norm = (v: string) => v.replace(/\s+/g, '').toLowerCase()
  return (await corePlaces()).filter(
    (p) => norm(p.name).includes(k) || norm(p.area).includes(k) || norm(p.kind).includes(k),
  )
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
    sourceUrl: d.place.sourceUrl,
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
