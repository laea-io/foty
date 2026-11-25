// DB 행 → 화면 모양(Theme). 화면 부품은 시연 때와 같은 타입을 그대로 받는다.
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import type { AnyDb } from '@/lib/server/domain/types'
import { dayLabel, deadlineLabel, parts, won } from '@/lib/server/util/time'
import type { Theme } from '@/lib/shared/theme'

export type ThemeView = Theme & {
  day: string
  deadlineAt: Date
  /** 수락 대기 중인 인원 */
  pending: number
  matched: boolean
  hostName: string
  hostKind: 'business' | 'resident'
  hostUserId: string
  corePlaceId: string
  intro: string
  confirmMode: 'auto' | 'manual'
  scheduleVersion: number
  meetDetail: string
  cancelReason: string | null
  costWon: number
  travelMin: number
}

type Row = typeof s.themes.$inferSelect

const join = (xs: string[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')}과 ${xs[xs.length - 1]}` : (xs[0] ?? '')

/** 추천 이유(문장, 점수 없음) — 보는 사람의 관심 활동과 겹치는 것 */
function reasonFor(activities: string[], prefs?: string[]) {
  const hit = prefs?.length ? activities.filter((a) => prefs.includes(a)) : []
  if (hit.length) return `날짜가 맞고, ${join(hit)}을 좋아해요`
  return `${activities.join('·')} 테마예요`
}

export async function loadThemes(
  db: AnyDb,
  opts: { ids?: string[]; where?: ReturnType<typeof and>; prefs?: string[]; order?: 'day' } = {},
): Promise<ThemeView[]> {
  const conds = [opts.ids ? inArray(s.themes.id, opts.ids) : undefined, opts.where].filter(Boolean)
  const rows = await db
    .select({ t: s.themes, host: s.hosts, core: s.places })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .innerJoin(s.places, eq(s.places.id, s.themes.corePlaceId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(s.themes.day), asc(s.themes.start))
  if (!rows.length) return []
  const ids = rows.map((r) => r.t.id)
  const stops = await db
    .select({ st: s.themeStops, p: s.places })
    .from(s.themeStops)
    .innerJoin(s.places, eq(s.places.id, s.themeStops.placeId))
    .where(inArray(s.themeStops.themeId, ids))
    .orderBy(asc(s.themeStops.themeId), asc(s.themeStops.ord))
  const counts = await db
    .select({
      themeId: s.applications.themeId,
      status: s.applications.status,
      n: sql<number>`sum(${s.applications.party})::int`,
    })
    .from(s.applications)
    .where(and(inArray(s.applications.themeId, ids), inArray(s.applications.status, ['수락', '신청 대기'])))
    .groupBy(s.applications.themeId, s.applications.status)
  const count = (id: string, st: string) =>
    Number(counts.find((c) => c.themeId === id && c.status === st)?.n ?? 0)

  const byId = new Map(rows.map((r) => [r.t.id, r]))
  const out = rows.map(({ t, host, core }) => {
    const myStops = stops.filter((x) => x.st.themeId === t.id)
    const current = count(t.id, '수락')
    const view: ThemeView = {
      id: t.id,
      title: t.title,
      place: core.name,
      area: core.area,
      hostId: host.id,
      date: dayLabel(t.day),
      dow: parts(t.day).dow,
      start: t.start,
      end: t.end,
      current,
      min: t.min,
      max: t.max,
      deadline: deadlineLabel(t.deadline),
      from: t.origin,
      travel: `${t.travelMin}분`,
      cost: won(t.costWon),
      status: t.status,
      image: { src: core.image, alt: core.imageAlt, bg: core.imageBg },
      route: myStops.map((x) => x.p.short ?? x.p.name).join(' → '),
      reason: reasonFor(t.activities, opts.prefs),
      activities: t.activities,
      stops: myStops.map((x) => ({
        name: x.p.name,
        time: x.st.time,
        stay: `${x.st.stayMin}분`,
        kind: x.p.kind,
        checked: x.p.checkedOn ? `${parts(x.p.checkedOn).m}월 ${parts(x.p.checkedOn).d}일` : null,
        next: x.st.next ?? undefined,
        fixed: x.st.fixed,
        image: { src: x.p.image, alt: x.p.imageAlt, bg: x.p.imageBg },
        lat: x.p.lat,
        lng: x.p.lng,
        sourceUrl: x.p.sourceUrl,
      })),
      meet: t.meet,
      include: t.include,
      exclude: t.exclude,
      day: t.day,
      deadlineAt: t.deadline,
      pending: count(t.id, '신청 대기'),
      matched: current >= t.min,
      hostName: host.name,
      hostKind: host.kind,
      hostUserId: host.userId,
      corePlaceId: core.id,
      intro: t.intro || host.intro,
      confirmMode: t.confirmMode,
      scheduleVersion: t.scheduleVersion,
      meetDetail: t.meetDetail,
      cancelReason: t.cancelReason,
      costWon: t.costWon,
      travelMin: t.travelMin,
    }
    return view
  })
  return opts.ids
    ? opts.ids.map((id) => out.find((x) => x.id === id)).filter((x): x is ThemeView => !!x && byId.has(x.id))
    : out
}

export async function loadTheme(db: AnyDb, id: string, prefs?: string[]) {
  return (await loadThemes(db, { ids: [id], prefs }))[0] ?? null
}

/** 보는 사람과 테마의 관계 — 상세 화면의 버튼·공개 범위를 정한다 */
export async function relation(db: AnyDb, themeId: string, userId?: string | null) {
  if (!userId) return { role: 'guest' as const, application: null }
  const [t] = await db
    .select({ hostUser: s.hosts.userId })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(eq(s.themes.id, themeId))
  if (t?.hostUser === userId) return { role: 'host' as const, application: null }
  const [a] = await db
    .select()
    .from(s.applications)
    .where(and(eq(s.applications.themeId, themeId), eq(s.applications.userId, userId)))
  if (a?.status === '수락') return { role: 'member' as const, application: a }
  if (a?.status === '신청 대기') return { role: 'applicant' as const, application: a }
  return { role: 'viewer' as const, application: a ?? null }
}

export type Relation = Awaited<ReturnType<typeof relation>>
export type ThemeRow = Row
