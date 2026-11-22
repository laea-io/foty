import 'server-only'
import { and, asc, eq, gte, inArray, ne, sql } from 'drizzle-orm'
import type { BadgeTone } from '@/components/ui/primitives'
import { db, schema as s } from '@/lib/db'
import type { HomeQuery } from '@/lib/demo/filters'
import type { Host } from '@/lib/demo/people'
import { getViewer } from '../auth'
import { inviteOk } from '../checkin-token'
import { loadThemes, type ThemeView } from '../domain/read'
import { deadlineLabel, today } from '../time'
import { homeThemes, upcomingDates, weekend, weekStrip } from './themes'

export type WeekDay = ReturnType<typeof weekStrip>[number]

/** 홈 · 조건 화면: 목록 + 달력 7칸 + 빈 화면 조건 요약 */
export async function homeData(q: HomeQuery) {
  const [list, week, dates] = [await homeThemes(q), weekStrip(), await upcomingDates()]
  const w = weekend()
  const days = week.filter((d) => d.iso === w.sat || d.iso === w.sun)
  const day = q.day ? (dates.find((x) => x.iso === q.day)?.label ?? q.day) : null
  const conditions = [
    q.view === 'next' ? '다음 주' : q.view === 'all' ? '전체 기간' : (day ?? '이번 주말'),
    `${q.origin} 출발`,
    q.transit === '0' ? '자차' : null,
    q.budget,
  ]
    .filter(Boolean)
    .join(' · ')
  return { list, week, days: days.length ? days : week.slice(0, 2), dates, conditions }
}

/** 호스트 블록(진행한 테마 = 여행 완료 수) */
export async function hostCard(hostId: string, intro?: string): Promise<Host | null> {
  const [h] = await db.select().from(s.hosts).where(eq(s.hosts.id, hostId))
  if (!h) return null
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.themes)
    .where(and(eq(s.themes.hostId, hostId), eq(s.themes.status, '여행 완료')))
  return { id: h.id, name: h.name, kind: h.kind, area: h.area, hosted: Number(n), intro: intro || h.intro }
}

/** 같은 테마의 다른 날짜 한 줄 */
export type OtherDate = {
  id: string
  label: string
  current: number
  min: number
  badge: { tone: BadgeTone; label: string }
}

const dateBadge = (current: number, min: number) =>
  current === 0
    ? { tone: 'soft' as const, label: '모집 중' }
    : current >= min
      ? { tone: 'ink' as const, label: '성사' }
      : { tone: 'warn' as const, label: `성사까지 ${min - current}명` }

const prefs = async () => (await getViewer())?.prefs.activities

/** 같은 호스트 · 같은 제목으로 모집 중인 다른 날짜 */
export async function otherDates(t: ThemeView): Promise<OtherDate[]> {
  const list = await loadThemes(db, {
    where: and(
      eq(s.themes.hostId, t.hostId),
      eq(s.themes.title, t.title),
      ne(s.themes.id, t.id),
      eq(s.themes.status, '모집 중'),
      gte(s.themes.day, today()),
    ),
  })
  return list.map((x) => ({
    id: x.id,
    label: `${x.date} ${x.start}`,
    current: x.current,
    min: x.min,
    badge: dateBadge(x.current, x.min),
  }))
}

/** 지금 신청할 수 있는 테마(모집 중 · 오늘 이후) */
async function openThemes(exclude: string) {
  return loadThemes(db, {
    where: and(eq(s.themes.status, '모집 중'), gte(s.themes.day, today()), ne(s.themes.id, exclude)),
    prefs: await prefs(),
  })
}

/** 비슷한 테마: 활동이 겹치는 모집 중 테마부터 */
export async function similarThemes(t: ThemeView, n = 2): Promise<ThemeView[]> {
  const others = await openThemes(t.id)
  const near = others.filter((x) => x.activities.some((a) => t.activities.includes(a)))
  return [...near, ...others.filter((x) => !near.includes(x))].slice(0, n)
}

/** 이 호스트의 새 테마(없으면 비슷한 테마 하나) */
export async function hostThemes(t: ThemeView): Promise<ThemeView[]> {
  const others = await openThemes(t.id)
  const same = others.filter((x) => x.hostId === t.hostId)
  return same.length ? same.slice(0, 1) : similarThemes(t, 1)
}

/** 그룹 사람 이름: 호스트 + 수락된 참여자(신청 순) */
export async function groupPeople(t: ThemeView) {
  const rows = await db
    .select({ name: s.users.name, party: s.applications.party })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .where(and(eq(s.applications.themeId, t.id), eq(s.applications.status, '수락')))
    .orderBy(asc(s.applications.createdAt))
  const guests = rows.map((r) => r.name)
  return { host: t.hostName, names: [t.hostName, ...guests], guests: t.current }
}

/** 집결 표시: 성사 뒤 공개된 집결 상세(없으면 시작 시각 · 모이는 곳) */
export const meetFor = (t: ThemeView) => t.meetDetail || `${t.start} · ${t.meet.split('에서')[0]}`

/** 친구 신청 마감(테마 모집 마감 6시간 전) */
export const inviteDeadline = (t: ThemeView) => deadlineLabel(new Date(t.deadlineAt.getTime() - 6 * 3600000))

/** 초대 링크의 신청 — 서명이 맞고, 그 테마의 열린 신청일 때만 */
export async function inviteFor(themeId: string, a?: string, sig?: string) {
  if (!a || !sig || !inviteOk(a, sig)) return null
  const [row] = await db
    .select({ a: s.applications, name: s.users.name })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .where(and(eq(s.applications.id, a), eq(s.applications.themeId, themeId)))
  if (!row || (row.a.status !== '신청 대기' && row.a.status !== '수락')) return null
  return row
}

/** 이 호스트의 새 날짜 알림을 받고 있나 */
export async function subscribedToHost(userId: string | undefined, hostId: string) {
  if (!userId) return false
  const rows = await db
    .select({ k: s.subscriptions.key })
    .from(s.subscriptions)
    .where(
      and(
        eq(s.subscriptions.userId, userId),
        eq(s.subscriptions.kind, 'host'),
        eq(s.subscriptions.key, hostId),
      ),
    )
  return rows.length > 0
}

/** 상태별 상세에 필요한 것: 내 참여 기록(체크인 · 참여 상태) · 변경 이력 수 · 확인 대기 변경 */
export async function detailExtras(themeId: string, userId?: string) {
  const [changes, pending] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.changes)
      .where(and(eq(s.changes.themeId, themeId), inArray(s.changes.status, ['반영됨', '반려됨', '제안됨']))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.changes)
      .where(and(eq(s.changes.themeId, themeId), eq(s.changes.status, '변경 확인 중'))),
  ])
  let attended: string | null = null
  let checkedIn = false
  if (userId) {
    const [att] = await db
      .select({ status: s.attendance.status })
      .from(s.attendance)
      .where(and(eq(s.attendance.themeId, themeId), eq(s.attendance.userId, userId)))
    const [ci] = await db
      .select({ id: s.checkins.id })
      .from(s.checkins)
      .where(and(eq(s.checkins.themeId, themeId), eq(s.checkins.userId, userId)))
    attended = att?.status ?? null
    checkedIn = !!ci
  }
  return {
    historyCount: Number(changes[0]?.n ?? 0),
    pending: Number(pending[0]?.n ?? 0),
    attended,
    checkedIn,
  }
}
