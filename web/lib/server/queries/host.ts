// 호스트 화면 읽기 — 내 테마, 신청자, 요청, 요약, 체크인 현황, 평가, 변경 이력.
import 'server-only'
import { and, asc, count, desc, eq, gte, inArray, lt, notInArray, sql } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db, schema as s } from '@/lib/db'
import { requireHost } from '@/lib/server/auth/session'
import { loadTheme, loadThemes } from '@/lib/server/queries/theme-view'
import { LISTED } from '@/lib/server/queries/themes'
import { addDays, dayLabel, hhmm, today } from '@/lib/server/util/time'
import type { Img } from '@/lib/shared/theme'

export const img = (p: typeof s.places.$inferSelect): Img => ({
  src: p.image,
  alt: p.imageAlt,
  bg: p.imageBg,
})

// ── 호스트 ───────────────────────────────────────────
export async function hostThemes(hostId: string) {
  const t = today()
  const all = await loadThemes(db, { where: eq(s.themes.hostId, hostId) })
  const active = all.filter((x) => (LISTED as readonly string[]).includes(x.status) && x.day >= t)
  return {
    // 아직 성사 전(모집 중·모집 마감)은 모집 탭, 성사된 것만 성사 탭
    recruiting: active.filter((x) => !x.matched && (x.status === '모집 중' || x.status === '모집 마감')),
    matched: active.filter((x) => x.matched),
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
async function topTags(userId: string, n = 3) {
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

/** 호스트 화면: 내 테마만(남의 테마면 없는 화면) */
export async function ownTheme(id: string, next: string) {
  const v = await requireHost(next)
  const t = await loadTheme(db, id)
  if (!t || t.hostId !== v.host.id) notFound()
  return { v, t }
}
