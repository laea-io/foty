// 운영팀 화면 읽기 — 호스트·신고 확인 큐, 사용자·게시글·테마·참여 확인 목록. 모두 db를 첫 인자로 받는다.
import 'server-only'
import { and, asc, desc, eq, gte, inArray, ne, or, sql } from 'drizzle-orm'
import type { BadgeTone } from '@/components/ui/primitives'
import * as s from '@/lib/db/schema'
import type { AnyDb } from '@/lib/server/domain/types'
import { like } from '@/lib/server/queries/search'
import { md, mdKo } from '@/lib/server/queries/stamps'
import { LISTED } from '@/lib/server/queries/themes'
import { ago, dayLabel, hhmm, today } from '@/lib/server/util/time'

// ── 운영팀 ───────────────────────────────────────────
export type AdminHost = {
  id: string
  name: string
  line: string
  badge: [BadgeTone, string]
  pending: boolean
  /** 확인 완료면 정지할 수 있고, 정지면 해제할 수 있다 */
  status: (typeof s.hostStatus.enumValues)[number]
  themes: number
  kind: string
  area: string
  intro: string
  contact: string
  /** 11.21 14:05 제출 */
  submitted: string
}
export type AdminReport = {
  id: string
  name: string
  line: string
  badge: [BadgeTone, string]
  open: boolean
  /** 처리 버튼 글자(불참 신고는 "불참 확인") */
  doneLabel: string
  href: string
  /** 신고한 사람·대상 바로 가기 */
  links: { href: string; label: string }[]
}

const stamp = (at: Date) => `${mdKo(at)} ${hhmm(at)}`

export async function adminQueue(db: AnyDb) {
  const hosts = await db.select().from(s.hosts).orderBy(asc(s.hosts.submittedAt))
  const counts = await db
    .select({ hostId: s.themes.hostId, n: sql<number>`count(*)::int` })
    .from(s.themes)
    .groupBy(s.themes.hostId)
  const kindLabel = (k: string) => (k === 'business' ? '가게' : '주민')
  const verified = (k: string): [BadgeTone, string] => ['ink', k === 'business' ? '사업장 확인' : '주민 인증']
  const toRow = (h: typeof s.hosts.$inferSelect): AdminHost => ({
    id: h.id,
    name: h.name,
    line: `${kindLabel(h.kind)} · ${h.area}${h.status === '확인 완료' ? '' : ` · ${md(today(h.submittedAt))} 제출`}`,
    badge:
      h.status === '확인 완료'
        ? verified(h.kind)
        : h.status === '확인 대기'
          ? ['warn', '확인 대기']
          : ['muted', h.status],
    pending: h.status === '확인 대기' || h.status === '보류',
    status: h.status,
    themes: Number(counts.find((c) => c.hostId === h.id)?.n ?? 0),
    kind: h.kind === 'business' ? '가게·관광지(사업장)' : '남양주 주민',
    area: h.area,
    intro: h.intro,
    contact: h.contact,
    submitted: stamp(h.submittedAt),
  })
  const open = hosts.filter((h) => h.status === '확인 대기' || h.status === '보류').map(toRow)
  const done = hosts
    .filter((h) => h.status === '확인 완료')
    .sort((a, b) => (b.verifiedAt?.getTime() ?? 0) - (a.verifiedAt?.getTime() ?? 0))
    .map(toRow)
  const stopped = hosts.filter((h) => h.status === '정지').map(toRow)

  // 검토 중인 신고는 오래돼도 전부, 끝난 신고는 최근 20개만
  const reportRows = (open: boolean) =>
    db
      .select({ r: s.reports, user: s.users, theme: s.themes })
      .from(s.reports)
      .leftJoin(s.users, eq(s.users.id, s.reports.targetUserId))
      .leftJoin(s.themes, eq(s.themes.id, s.reports.targetThemeId))
      .where(open ? eq(s.reports.status, '검토 중') : ne(s.reports.status, '검토 중'))
      .orderBy(desc(s.reports.createdAt))
      .limit(open ? 500 : 20)
  const [openReps, closedReps] = await Promise.all([reportRows(true), reportRows(false)])
  const reporterIds = [...new Set([...openReps, ...closedReps].map((x) => x.r.reporterId))]
  const reporters = reporterIds.length
    ? await db
        .select({ id: s.users.id, name: s.users.name, handle: s.users.handle })
        .from(s.users)
        .where(inArray(s.users.id, reporterIds))
    : []
  const reports: AdminReport[] = [...openReps, ...closedReps].map(({ r, user, theme }) => {
    const by = reporters.find((x) => x.id === r.reporterId)
    const links = [
      user ? { href: `/users/${user.handle}`, label: `대상 ${user.name}` } : null,
      theme ? { href: `/themes/${theme.id}`, label: `테마 ${theme.title}` } : null,
      by ? { href: `/users/${by.handle}`, label: `신고한 사람 ${by.name}` } : null,
    ].filter((x): x is { href: string; label: string } => !!x)
    return {
      id: r.id,
      name: user?.name ?? theme?.title ?? '운영팀 문의',
      line: [r.reason, `${md(today(r.createdAt))} 접수`, r.detail || null, user && theme ? theme.title : null]
        .filter(Boolean)
        .join(' · '),
      badge: (r.status === '검토 중'
        ? ['warn', '검토 중']
        : r.status === '처리 완료'
          ? ['soft', '처리 완료']
          : ['muted', '반려']) as [BadgeTone, string],
      open: r.status === '검토 중',
      doneLabel: r.reason === '약속 시간 불참' ? '불참 확인' : '처리 완료',
      href: user ? `/users/${user.handle}` : theme ? `/themes/${theme.id}` : '/admin',
      links,
    }
  })
  return {
    hosts: [...open, ...done, ...stopped],
    openHosts: open.filter((h) => h.badge[1] === '확인 대기').length,
    reports,
    openReports: reports.filter((r) => r.open).length,
  }
}

export type AdminUser = {
  id: string
  handle: string
  name: string
  email: string | null
  role: string
  kakao: boolean
  created: string
  suspended: boolean
  deleted: boolean
}

/** 사용자 찾기(handle·이름·이메일). 검색어가 없으면 최근 가입 30명 */
export async function adminUsers(db: AnyDb, q = ''): Promise<AdminUser[]> {
  const k = q.trim().toLowerCase()
  const rows = await db
    .select()
    .from(s.users)
    .where(
      k
        ? or(
            sql`lower(${s.users.handle}) like ${like(k)}`,
            sql`lower(${s.users.name}) like ${like(k)}`,
            sql`lower(coalesce(${s.users.email}, '')) like ${like(k)}`,
          )
        : undefined,
    )
    .orderBy(desc(s.users.createdAt))
    .limit(k ? 50 : 30)
  return rows.map((u) => ({
    id: u.id,
    handle: u.handle,
    name: u.name,
    email: u.email,
    role: u.role,
    kakao: !!u.kakaoId,
    created: mdKo(u.createdAt),
    suspended: !!u.suspendedAt,
    deleted: u.handle.startsWith('deleted-'),
  }))
}

export type AdminPost = {
  id: string
  title: string
  kind: string
  author: string
  when: string
  hidden: boolean
  comments: { id: string; author: string; body: string; when: string; hidden: boolean }[]
}

/** 커뮤니티 관리: 최근 글 20개 + 각 글의 댓글(숨긴 것 포함) */
export async function adminPosts(db: AnyDb, now = new Date()): Promise<AdminPost[]> {
  const rows = await db
    .select({ p: s.posts, author: s.users.name })
    .from(s.posts)
    .innerJoin(s.users, eq(s.users.id, s.posts.authorId))
    .orderBy(desc(s.posts.createdAt))
    .limit(20)
  const ids = rows.map((r) => r.p.id)
  const cs = ids.length
    ? await db
        .select({ c: s.comments, author: s.users.name })
        .from(s.comments)
        .innerJoin(s.users, eq(s.users.id, s.comments.authorId))
        .where(inArray(s.comments.postId, ids))
        .orderBy(asc(s.comments.createdAt))
    : []
  return rows.map(({ p, author }) => ({
    id: p.id,
    title: p.title,
    kind: p.kind,
    author,
    when: ago(p.createdAt, now),
    hidden: !!p.hiddenAt,
    comments: cs
      .filter((x) => x.c.postId === p.id)
      .map((x) => ({
        id: x.c.id,
        author: x.author,
        body: x.c.body,
        when: ago(x.c.createdAt, now),
        hidden: !!x.c.hiddenAt,
      })),
  }))
}

/** 운영팀이 취소할 수 있는 테마: 아직 끝나지 않은 앞으로의 테마 */
export async function adminThemes(db: AnyDb, now = new Date()) {
  const rows = await db
    .select({ t: s.themes, host: s.hosts.name })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(and(inArray(s.themes.status, [...LISTED]), gte(s.themes.day, today(now))))
    .orderBy(asc(s.themes.day))
    .limit(40)
  return rows.map(({ t, host }) => ({
    id: t.id,
    title: t.title,
    line: `${dayLabel(t.day)} · ${host} · ${t.status}`,
  }))
}

/** 참여 기록 검토 중(호스트 확인과 체크인이 어긋난 것) */
export async function adminAttendance(db: AnyDb) {
  const rows = await db
    .select({
      a: s.attendance,
      title: s.themes.title,
      day: s.themes.day,
      name: s.users.name,
      handle: s.users.handle,
    })
    .from(s.attendance)
    .innerJoin(s.themes, eq(s.themes.id, s.attendance.themeId))
    .innerJoin(s.users, eq(s.users.id, s.attendance.userId))
    .where(eq(s.attendance.status, '검토 중'))
    .orderBy(asc(s.attendance.updatedAt))
  return rows.map((r) => ({
    themeId: r.a.themeId,
    userId: r.a.userId,
    title: r.title,
    name: r.name,
    handle: r.handle,
    line: [dayLabel(r.day), r.a.note].filter(Boolean).join(' · '),
  }))
}
