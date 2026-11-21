import 'server-only'
import { and, asc, desc, eq, gt, inArray, ne, sql } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import type {
  ChangeView,
  ChatMsg,
  HistoryItem,
  Member,
  SpaceData,
  TripBadge,
} from '@/components/b/trips/types'
import { db, schema as s } from '@/lib/db'
import { regions } from '@/lib/demo/stamps'
import { requireViewer } from '../auth'
import { reviewDeadline, reviewTargets } from '../b/writes'
import { loadThemes, type ThemeView } from '../domain/read'
import { suggestPlaces } from '../suggest'
import { dday, hhmm, parts, today } from '../time'
import { themeDetail } from './themes'

const md = (day: string) => {
  const p = parts(day)
  return `${p.m}월 ${p.d}일`
}
const kstDay = (at: Date) => today(at)

// ── 내 여행 ──────────────────────────────────────────
export type ApplyingItem = { t: ThemeView; badges: TripBadge[] }
export type UpcomingItem = { t: ThemeView; dday: string; status: string; alert?: string; meet?: string }
export type CancelledItem = { t: ThemeView; reason: string; href: string; label: string; badge: TripBadge }
export type PastItem = {
  t: ThemeView
  badges: TripBadge[]
  note?: string
  review?: string
  canReview: boolean
  /** 검토 중: 참여했다고 알렸나 */
  told?: boolean
  askable?: boolean
}

const attTone: Record<string, TripBadge['tone']> = {
  '참여 확인': 'ink',
  '검토 중': 'warn',
  '불참 확인': 'muted',
  '확인 대기': 'soft',
}

const progressBadge = (t: ThemeView): TripBadge =>
  t.current >= t.min
    ? { tone: 'ink', label: '성사' }
    : { tone: 'warn', label: `성사까지 ${t.min - t.current}명` }

export async function myTrips(userId: string) {
  const apps = await db.select().from(s.applications).where(eq(s.applications.userId, userId))
  if (!apps.length) return { applying: [], upcoming: [], cancelled: [], past: [] }
  const themes = await loadThemes(db, { ids: apps.map((a) => a.themeId) })
  const byId = new Map(themes.map((t) => [t.id, t]))
  const ids = themes.map((t) => t.id)
  const [att, pend] = await Promise.all([
    db
      .select()
      .from(s.attendance)
      .where(and(eq(s.attendance.userId, userId), inArray(s.attendance.themeId, ids))),
    // 내가 아직 확인하지 않은 주요 변경
    db
      .select({ themeId: s.changes.themeId, label: s.changes.label })
      .from(s.changes)
      .where(
        and(
          inArray(s.changes.themeId, ids),
          eq(s.changes.status, '변경 확인 중'),
          sql`not exists (select 1 from ${s.changeConfirms} cc where cc.change_id = ${s.changes.id} and cc.user_id = ${userId})`,
        ),
      ),
  ])
  const t0 = today()
  const applying: ApplyingItem[] = []
  const upcoming: UpcomingItem[] = []
  const cancelled: CancelledItem[] = []
  const past: PastItem[] = []
  for (const a of apps) {
    const t = byId.get(a.themeId)
    if (!t) continue
    const open = a.status === '신청 대기' || a.status === '수락'
    if (t.status === '취소') {
      if (!open) continue
      const auto = t.cancelReason === '최소 인원 미달'
      const reason = auto ? '최소 인원이 모이지 않아 취소됐어요.' : '호스트 사정으로 취소됐어요.'
      const href = auto ? `/themes/${t.id}/cancelled` : `/themes/${t.id}/host-cancelled`
      if (t.day >= t0)
        cancelled.push({
          t,
          reason,
          href,
          label: '다른 날짜와 비슷한 테마 보기',
          badge: { tone: 'muted', label: '취소' },
        })
      past.push({ t, badges: [{ tone: 'muted', label: '취소' }], note: reason, canReview: false })
      continue
    }
    if (a.status === '거절') {
      if (t.day >= t0)
        cancelled.push({
          t,
          reason: '이번에는 함께하지 못하게 됐어요.',
          href: `/themes/${t.id}/rejected`,
          label: '비슷한 테마 보기',
          badge: { tone: 'muted', label: '거절' },
        })
      continue
    }
    if (!open) continue
    if (t.status === '여행 완료') {
      if (a.status !== '수락') continue
      const at = att.find((x) => x.themeId === t.id)
      const st = at?.status ?? '확인 대기'
      const deadline = reviewDeadline(t.day)
      const inWindow = t0 <= deadline
      const item: PastItem = {
        t,
        badges: [
          { tone: 'soft', label: '여행 완료' },
          { tone: attTone[st] ?? 'soft', label: st },
        ],
        canReview: st === '참여 확인' && inWindow,
      }
      if (st === '참여 확인')
        item.review = inWindow ? `평가는 ${md(deadline)}까지 남길 수 있어요` : '평가 기간이 끝났어요'
      if (st === '검토 중') {
        item.note = '체크인 기록이 없어 참여 여부를 확인하고 있어요. 호스트 확인과 맞춰 본 뒤 알려드릴게요.'
        item.askable = true
        item.told = !!at?.note
      }
      if (st === '불참 확인') item.note = '참여하지 않은 것으로 확인됐어요.'
      past.push(item)
      continue
    }
    if (t.day < t0) continue
    if (a.status === '수락' && t.matched) {
      const p = pend.find((x) => x.themeId === t.id)
      upcoming.push({
        t,
        dday: dday(t.day),
        status: t.status,
        alert: p ? `${p.label} 변경 확인이 필요해요` : undefined,
        meet: t.meetDetail ? `집결 ${t.meetDetail}` : undefined,
      })
    } else {
      applying.push({
        t,
        badges: [{ tone: 'soft', label: a.status === '수락' ? '수락' : '신청 대기' }, progressBadge(t)],
      })
    }
  }
  const byDay = (x: { t: ThemeView }, y: { t: ThemeView }) =>
    x.t.day.localeCompare(y.t.day) || x.t.start.localeCompare(y.t.start)
  applying.sort(byDay)
  upcoming.sort(byDay)
  cancelled.sort(byDay)
  past.sort((x, y) => byDay(y, x))
  return { applying, upcoming, cancelled, past }
}

// ── 그룹 여행 공간 ──────────────────────────────────
/** 그룹(호스트 + 수락된 참여자)만. 아니면 404, 비로그인은 로그인으로 */
export async function loadSpace(id: string, next?: string): Promise<SpaceData> {
  const viewer = await requireViewer(next ?? `/trips/${id}`)
  const d = await themeDetail(id)
  if (!d) notFound()
  const { theme: t, rel } = d
  if (rel.role !== 'member' && rel.role !== 'host') notFound()
  const opened = t.matched || ['일정 조율 중', '일정 확정', '여행 완료'].includes(t.status)
  if (!opened) redirect(`/themes/${id}`)
  const members = await groupMembers(t, viewer.id)
  const change = await pendingChange(t, members)
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.changes)
    .where(and(eq(s.changes.themeId, id), ne(s.changes.status, '변경 확인 중')))
  return {
    t,
    dday: dday(t.day),
    status: t.status,
    members,
    change,
    historyCount: Number(n),
    me: members.find((m) => m.me) ?? null,
    isHost: rel.role === 'host',
  }
}

/** 호스트 + 수락된 참여자 → 화면의 Member */
async function groupMembers(t: ThemeView, viewerId: string): Promise<Member[]> {
  const [hostRow] = await db
    .select({ u: s.users, h: s.hosts })
    .from(s.hosts)
    .innerJoin(s.users, eq(s.users.id, s.hosts.userId))
    .where(eq(s.hosts.id, t.hostId))
  const guests = await db
    .select({ u: s.users })
    .from(s.applications)
    .innerJoin(s.users, eq(s.users.id, s.applications.userId))
    .where(and(eq(s.applications.themeId, t.id), eq(s.applications.status, '수락')))
    .orderBy(asc(s.applications.createdAt))
  const users = [hostRow.u, ...guests.map((g) => g.u)]
  const ids = users.map((u) => u.id)
  const [trips, reviews, checked, [{ hosted }]] = await Promise.all([
    db
      .select({ userId: s.attendance.userId, n: sql<number>`count(*)::int` })
      .from(s.attendance)
      .where(
        and(
          inArray(s.attendance.userId, ids),
          eq(s.attendance.status, '참여 확인'),
          ne(s.attendance.themeId, t.id),
        ),
      )
      .groupBy(s.attendance.userId),
    db
      .select({ toUser: s.peerReviews.toUser, tags: s.peerReviews.tags })
      .from(s.peerReviews)
      .where(inArray(s.peerReviews.toUser, ids)),
    db.select({ userId: s.checkins.userId }).from(s.checkins).where(eq(s.checkins.themeId, t.id)),
    db
      .select({ hosted: sql<number>`count(*)::int` })
      .from(s.themes)
      .where(and(eq(s.themes.hostId, t.hostId), eq(s.themes.status, '여행 완료'))),
  ])
  const came = new Set(checked.map((c) => c.userId))
  /** 받은 행동 태그(많이 받은 순, 횟수만 — 점수 없음) */
  const tagsOf = (id: string) => {
    const n = new Map<string, number>()
    for (const r of reviews.filter((x) => x.toUser === id))
      for (const tag of r.tags) n.set(tag, (n.get(tag) ?? 0) + 1)
    return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
  }
  return users.map((u, i) => {
    const isHost = i === 0
    const n = Number(trips.find((x) => x.userId === u.id)?.n ?? 0)
    const from = u.origin ? `${u.origin} 출발` : '출발지 비공개'
    const hostLine = `${hostRow.h.kind === 'resident' ? '남양주 주민 인증' : '사업장 확인'} · 진행한 테마 ${hosted}회`
    const tags = tagsOf(u.id)
    return {
      id: u.handle,
      userId: u.id,
      name: isHost ? hostRow.h.name : u.name,
      host: isHost,
      me: u.id === viewerId,
      line: isHost ? hostLine : n ? `${from} · 동행 ${n}회` : from,
      sheetLine: isHost
        ? `${hostRow.h.area} · 진행한 테마 ${hosted}회`
        : `${from} · ${n ? `동행 ${n}회` : '첫 동행'}`,
      tags: tags.length ? tags.slice(0, 3) : !isHost && !n ? ['첫 동행이에요'] : [],
      checkedIn: came.has(u.id),
    }
  })
}

async function pendingChange(t: ThemeView, members: Member[]): Promise<ChangeView | null> {
  const [c] = await db
    .select({ c: s.changes, proposer: s.users.id })
    .from(s.changes)
    .innerJoin(s.users, eq(s.users.id, s.changes.proposerId))
    .where(and(eq(s.changes.themeId, t.id), eq(s.changes.status, '변경 확인 중')))
    .orderBy(desc(s.changes.createdAt))
    .limit(1)
  if (!c) return null
  const got = await db
    .select({ userId: s.changeConfirms.userId })
    .from(s.changeConfirms)
    .where(eq(s.changeConfirms.changeId, c.c.id))
  const ok = new Set(got.map((g) => g.userId))
  const proposer = members.find((m) => m.userId === c.proposer)
  const who = proposer?.host ? `호스트 ${proposer.name}` : `${proposer?.name ?? '참여자'} 제안`
  const place =
    c.c.kind === 'meet_time' || c.c.kind === 'meet_place'
      ? (t.meetDetail.split(' · ')[1] ?? t.meet.split('에서')[0]).split(' ')[0]
      : ''
  return {
    id: c.c.id,
    label: c.c.label,
    from: c.c.fromText,
    to: c.c.toText,
    where: [place, who].filter(Boolean).join(' · '),
    confirmed: members.filter((m) => ok.has(m.userId)).map((m) => m.name),
    waiting: members.filter((m) => !ok.has(m.userId)).map((m) => m.name),
    total: members.length,
    mine: members.some((m) => m.me && ok.has(m.userId)),
    at: c.c.createdAt.toISOString(),
  }
}

/** 변경 이력(최근 순) */
export async function changeHistory(sp: SpaceData): Promise<HistoryItem[]> {
  const rows = await db
    .select({ c: s.changes, name: s.users.name, proposer: s.users.id })
    .from(s.changes)
    .innerJoin(s.users, eq(s.users.id, s.changes.proposerId))
    .where(eq(s.changes.themeId, sp.t.id))
    .orderBy(desc(s.changes.createdAt))
  const tone: Record<string, TripBadge['tone']> = {
    '변경 확인 중': 'warn',
    반영됨: 'ink',
    반려됨: 'muted',
    제안됨: 'soft',
  }
  return rows.map(({ c, name, proposer }) => {
    const host = sp.members.find((m) => m.host)
    const isHost = host?.userId === proposer
    const who = isHost ? `호스트 ${host?.name}` : name
    const p = parts(kstDay(c.createdAt))
    const meta =
      c.status === '변경 확인 중' && sp.change?.id === c.id
        ? `${who} · ${sp.change.confirmed.length} / ${sp.change.total}명 확인`
        : [
            `${p.m}.${p.d}`,
            c.source === 'AI 대안' ? 'AI 대안' : null,
            isHost ? who : `${name} 제안`,
            c.status === '반영됨' && !isHost ? '호스트 반영' : null,
          ]
            .filter(Boolean)
            .join(' · ')
    return {
      id: c.id,
      badge: { tone: tone[c.status] ?? 'soft', label: c.status },
      meta,
      what: c.label,
      from: c.fromText,
      to: c.toText,
    }
  })
}

// ── 대화 ─────────────────────────────────────────────
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const dayHead = (at: Date) => {
  const d = kstDay(at)
  const p = parts(d)
  return `${p.m}월 ${p.d}일 ${DOW[new Date(`${d}T00:00:00Z`).getUTCDay()]}요일`
}

/** 대화(오래된 순). since가 있으면 그 뒤에 온 것만 */
export async function chatMessages(themeId: string, viewerId: string, since?: Date): Promise<ChatMsg[]> {
  const [h] = await db
    .select({ userId: s.hosts.userId, name: s.hosts.name })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(eq(s.themes.id, themeId))
  const rows = await db
    .select({ m: s.messages, name: s.users.name })
    .from(s.messages)
    .leftJoin(s.users, eq(s.users.id, s.messages.userId))
    .where(and(eq(s.messages.themeId, themeId), since ? gt(s.messages.createdAt, since) : undefined))
    .orderBy(asc(s.messages.createdAt))
    .limit(300)
  return rows.map(({ m, name }) => toChat(m, name, viewerId, h))
}

export function toChat(
  m: typeof s.messages.$inferSelect,
  name: string | null,
  viewerId: string,
  host?: { userId: string; name: string },
): ChatMsg {
  const isHost = !!m.userId && m.userId === host?.userId
  return {
    id: m.id,
    mine: !!m.userId && m.userId === viewerId,
    system: !m.userId,
    from: isHost ? (host?.name ?? name ?? '') : (name ?? '알 수 없음'),
    role: isHost ? '호스트' : undefined,
    text: m.body,
    time: hhmm(m.createdAt),
    day: dayHead(m.createdAt),
    at: m.createdAt.toISOString(),
  }
}

// ── 체크인 ───────────────────────────────────────────
const regionName = (id: string | null) =>
  id
    ? (regions.find((r) => r.id === id)?.name ?? ({ byeollae: '별내' } as Record<string, string>)[id] ?? id)
    : ''

/** 내 체크인(스탬프): 시각 · 장소 · 같은 장소 몇 번째 · 권역 첫 스탬프인지 */
export async function myCheckin(themeId: string, userId: string) {
  const [row] = await db
    .select({ c: s.checkins, p: s.places })
    .from(s.checkins)
    .innerJoin(s.places, eq(s.places.id, s.checkins.placeId))
    .where(and(eq(s.checkins.themeId, themeId), eq(s.checkins.userId, userId)))
  if (!row) return null
  const [[{ visits }], [{ inRegion }]] = await Promise.all([
    db
      .select({ visits: sql<number>`count(*)::int` })
      .from(s.checkins)
      .where(and(eq(s.checkins.userId, userId), eq(s.checkins.placeId, row.p.id))),
    db
      .select({ inRegion: sql<number>`count(distinct ${s.checkins.placeId})::int` })
      .from(s.checkins)
      .innerJoin(s.places, eq(s.places.id, s.checkins.placeId))
      .where(
        and(eq(s.checkins.userId, userId), row.p.region ? eq(s.places.region, row.p.region) : undefined),
      ),
  ])
  const region = regionName(row.p.region)
  const v = Number(visits)
  const note = [
    region,
    v > 1 ? `${v}번째 방문이에요` : Number(inRegion) <= 1 ? '이 권역의 첫 스탬프예요' : '새 스탬프예요',
  ]
    .filter(Boolean)
    .join(' · ')
  return { time: hhmm(row.c.createdAt), day: kstDay(row.c.createdAt), place: row.p.name, visits: v, note }
}

// ── AI 도우미 ────────────────────────────────────────
export async function aiSuggest(sp: SpaceData, ask: string) {
  const stops = await db
    .select({ placeId: s.themeStops.placeId })
    .from(s.themeStops)
    .where(eq(s.themeStops.themeId, sp.t.id))
  const r = await suggestPlaces(db, {
    corePlaceId: sp.t.corePlaceId,
    ask,
    exclude: stops.map((x) => x.placeId),
    n: 6,
  })
  const checked = r.places.filter((p) => p.checkedOn)
  const unchecked = r.places.filter((p) => !p.checkedOn)
  const latest = checked
    .map((p) => p.checkedOn as string)
    .sort()
    .pop()
  return {
    understood: r.understood,
    places: checked.slice(0, 2),
    unchecked: unchecked[0] ?? null,
    checkedOn: latest ? md(latest) : null,
  }
}

// ── 평가 ─────────────────────────────────────────────
export async function reviewData(themeId: string, userId: string) {
  const r = await reviewTargets(db, themeId, userId)
  const users = r.targets.length ? await db.select().from(s.users).where(inArray(s.users.id, r.targets)) : []
  const [hostName] = await db
    .select({ name: s.hosts.name })
    .from(s.hosts)
    .where(eq(s.hosts.userId, r.hostUser))
  const mine = await db
    .select()
    .from(s.peerReviews)
    .where(and(eq(s.peerReviews.themeId, themeId), eq(s.peerReviews.fromUser, userId)))
  const [ci] = await db
    .select({ firstVisit: s.checkins.firstVisit })
    .from(s.checkins)
    .where(and(eq(s.checkins.themeId, themeId), eq(s.checkins.userId, userId)))
  const people = r.targets
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => !!u)
    .map((u) => ({
      id: u.handle,
      name: u.id === r.hostUser ? (hostName?.name ?? u.name) : u.name,
      host: u.id === r.hostUser,
      tags: mine.find((x) => x.toUser === u.id)?.tags ?? [],
    }))
  return {
    status: r.theme.status,
    allowed: r.allowed,
    people,
    firstVisit: ci?.firstVisit ?? null,
    deadline: reviewDeadline(r.theme.day),
    late: today() > reviewDeadline(r.theme.day),
  }
}
