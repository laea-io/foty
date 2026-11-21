import 'server-only'
import { and, gte, inArray, lte, sql } from 'drizzle-orm'
import { db, schema as s } from '@/lib/db'
import type { HomeQuery } from '@/lib/demo/filters'
import { getViewer } from '../auth'
import { loadTheme, loadThemes, relation, type ThemeView } from '../domain/read'
import { addDays, dayLabel, parts, today } from '../time'

export type { ThemeView }

/** 목록에 보이는 상태(취소·완료는 목록에서 뺀다) */
export const LISTED = ['모집 중', '모집 마감', '일정 조율 중', '일정 확정'] as const

/** 이번 주말(토·일) — 오늘이 일요일이면 오늘만 */
export function weekend(now = new Date()) {
  const t = today(now)
  const dow = new Date(`${t}T00:00:00Z`).getUTCDay()
  const sat = dow === 0 ? addDays(t, -1) : addDays(t, 6 - dow)
  return { sat, sun: addDays(sat, 1), from: dow === 0 ? t : t }
}

/** 홈 달력 7칸(오늘부터) */
export function weekStrip(now = new Date()) {
  const t = today(now)
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(t, i)
    const p = parts(day)
    return { day: p.d, dow: i === 0 ? '오늘' : p.dow, date: dayLabel(day), iso: day }
  })
}

const budgetMax: Record<string, number> = { '1만원 이하': 10000, '2만원 이하': 20000, '3만원 이하': 30000 }
const offset: Record<string, number> = { 상봉역: 0, 청량리역: 10, 구리역: -10, 잠실역: 20 }

/** 홈 · 조건 결과. 이동 시간은 상봉역 기준 값에 출발지 차이를 더한다(실제 경로 계산 전) */
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
  if (q.day) {
    const d = weekStrip(now).find((x) => String(x.day) === q.day)
    if (d) from = to = d.iso
  }
  const conds = [inArray(s.themes.status, [...LISTED]), gte(s.themes.day, from), lte(s.themes.day, to)]
  if (q.budget && budgetMax[q.budget]) conds.push(lte(s.themes.costWon, budgetMax[q.budget]))
  if (q.transit === '1') conds.push(sql`${s.themes.transit} = true`)
  if (q.act) conds.push(sql`${s.themes.activities} && ${q.act.split(',')}::text[]`)
  const list = await loadThemes(db, { where: and(...conds), prefs: viewer?.prefs.activities })
  const off = offset[q.origin ?? '상봉역'] ?? 0
  return list.map((x) => ({ ...x, from: q.origin ?? x.from, travel: `${x.travelMin + off}분` }))
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
