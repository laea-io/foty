// 사람·호스트 프로필 읽기 — 구독 여부, 함께 간 테마, 사용자·호스트 프로필.
import 'server-only'
import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import type { AnyDb } from '@/lib/server/domain/types'
import { tagCounts, tasteOf, tripCount } from '@/lib/server/queries/my'
import { isBlocked } from '@/lib/server/queries/safety'
import { loadThemes } from '@/lib/server/queries/theme-view'
import { LISTED } from '@/lib/server/queries/themes'
import { today } from '@/lib/server/util/time'

/** 목록에 보이는 상태(q/themes.ts의 LISTED와 같다 — 그 모듈은 운영 db를 불러와서 여기서는 따로 둔다) */
const MATCHED_STATUS = ['일정 조율 중', '일정 확정', '여행 완료'] as const

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
async function sharedMatchedThemes(db: AnyDb, a: string, b: string) {
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
