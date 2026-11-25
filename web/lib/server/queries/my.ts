// 마이 화면 읽기 — 취향, 여행 수, 마이 첫 화면, 알림.
import 'server-only'
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import type { AnyDb } from '@/lib/server/domain/types'
import { stampbook } from '@/lib/server/queries/stamps'
import { LISTED } from '@/lib/server/queries/themes'
import { rules } from '@/lib/server/util/rules'
import { ago, today } from '@/lib/server/util/time'

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
export async function notificationsOf(db: AnyDb, userId: string, now = new Date(), limit = 30) {
  const rows = await db
    .select()
    .from(s.notifications)
    .where(eq(s.notifications.userId, userId))
    .orderBy(desc(s.notifications.createdAt))
    .limit(Math.min(Math.max(limit, 1), 300))
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    unread: !n.readAt,
    when: ago(n.createdAt, now),
  }))
}
