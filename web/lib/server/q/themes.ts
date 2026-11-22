import 'server-only'
import { and, gte, inArray, lte, sql } from 'drizzle-orm'
import { db, schema as s } from '@/lib/db'
import type { HomeQuery } from '@/lib/demo/filters'
import { DEFAULT_ORIGIN, findStation, originPoint, travelEstimate } from '@/lib/stations'
import { getViewer } from '../auth'
import { loadTheme, loadThemes, relation, type ThemeView } from '../domain/read'
import { addDays, bookableSaturday, dayLabel, parts, today } from '../time'

export type { ThemeView }

/** 목록에 보이는 상태(취소·완료는 목록에서 뺀다) */
export const LISTED = ['모집 중', '모집 마감', '일정 조율 중', '일정 확정'] as const

/** 이번 주말(토·일) — 오늘이 일요일이면 오늘만 */
export function weekend(now = new Date()) {
  const sat = bookableSaturday(now)
  return { sat, sun: addDays(sat, 1), from: today(now) }
}

/** 홈 달력 7칸(오늘부터) */
export function weekStrip(now = new Date()) {
  const t = today(now)
  // 오늘부터 7칸, 이번 주말(신청 가능한 주말)이 더 뒤면 그 일요일까지(최대 9칸)
  const sun = weekend(now).sun
  const span =
    Math.round((new Date(`${sun}T00:00:00Z`).getTime() - new Date(`${t}T00:00:00Z`).getTime()) / 86400000) + 1
  return Array.from({ length: Math.min(9, Math.max(7, span)) }, (_, i) => {
    const day = addDays(t, i)
    const p = parts(day)
    return { day: p.d, dow: i === 0 ? '오늘' : p.dow, date: dayLabel(day), iso: day }
  })
}

const budgetMax: Record<string, number> = {
  '1만원 이하': 10000,
  '2만원 이하': 20000,
  '3만원 이하': 30000,
  '5만원 이하': 50000,
}

/** 조건에 없으면: 내 프로필의 출발지(역 이름과 맞으면) → 상봉역 */
export async function defaultOrigin() {
  const o = (await getViewer())?.origin?.trim()
  if (!o) return DEFAULT_ORIGIN
  return (findStation(o) ?? findStation(`${o}역`))?.name ?? DEFAULT_ORIGIN
}

/** 앞으로 60일 동안 모집 중인 테마가 있는 날짜(조건의 날짜 칩) */
export async function upcomingDates(now = new Date()) {
  const t = today(now)
  const rows = await db
    .select({ day: s.themes.day, n: sql<number>`count(*)::int` })
    .from(s.themes)
    .where(
      and(inArray(s.themes.status, ['모집 중']), gte(s.themes.day, t), lte(s.themes.day, addDays(t, 60))),
    )
    .groupBy(s.themes.day)
    .orderBy(s.themes.day)
  return rows.map((r) => ({ iso: r.day, label: dayLabel(r.day), count: Number(r.n) }))
}

/** 홈 · 조건 결과. 이동 시간은 출발지 → 핵심 장소 직선거리로 어림한다("약") */
export async function homeThemes(q: HomeQuery, now = new Date()) {
  const viewer = await getViewer()
  const t = today(now)
  const w = weekend(now)
  let from = t
  let to = w.sun
  if (q.view === 'next') {
    from = addDays(w.sat, 7)
    to = addDays(w.sat, 8)
  } else if (q.view === 'all') to = addDays(t, 60)
  if (q.day && q.day >= t) from = to = q.day
  const conds = [inArray(s.themes.status, [...LISTED]), gte(s.themes.day, from), lte(s.themes.day, to)]
  if (q.budget && budgetMax[q.budget]) conds.push(lte(s.themes.costWon, budgetMax[q.budget]))
  if (q.transit === '1') conds.push(sql`${s.themes.transit} = true`)
  if (q.act) conds.push(sql`${s.themes.activities} && ${q.act.split(',')}::text[]`)
  const list = await loadThemes(db, { where: and(...conds), prefs: viewer?.prefs.activities })
  const origin = q.origin ?? DEFAULT_ORIGIN
  const at = originPoint(origin, q.at)
  const car = q.transit === '0'
  return list.map((x) => {
    const core = x.stops.find((st) => st.fixed) ?? x.stops[0]
    const min =
      at && core?.lat && core.lng ? travelEstimate(at, { lat: core.lat, lng: core.lng }, car) : x.travelMin
    return { ...x, from: origin, travel: `약 ${min}분` }
  })
}

/** 상세 + 보는 사람과의 관계 */
export async function themeDetail(id: string) {
  const viewer = await getViewer()
  const t = await loadTheme(db, id, viewer?.prefs.activities)
  if (!t) return null
  return { theme: t, viewer, rel: await relation(db, id, viewer?.id) }
}

/** 여러 테마(id 순서 유지) */
export async function themesByIds(ids: string[]) {
  const viewer = await getViewer()
  return loadThemes(db, { ids, prefs: viewer?.prefs.activities })
}
