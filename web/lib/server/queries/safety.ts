// 신고·차단 읽기 — 신고 대상, 신고 배지, 차단·신고 목록, 차단 여부.
import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import type { BadgeTone } from '@/components/ui/primitives'
import * as s from '@/lib/db/schema'
import type { AnyDb } from '@/lib/server/domain/types'
import { mdKo } from '@/lib/server/queries/stamps'

// ── 신고 ─────────────────────────────────────────────
export type ReportTarget = {
  name: string
  line: string
  person: boolean
  back: string
  userId: string | null
  handle: string | null
  themeId: string | null
}

/** ?user=<handle> · ?theme=<id> (둘 다면 그 테마 안의 사람). 둘 다 없으면 운영팀에 보내는 내용 */
export async function reportTarget(
  db: AnyDb,
  q: { user?: string; theme?: string },
): Promise<ReportTarget | null> {
  const [u] = q.user ? await db.select().from(s.users).where(eq(s.users.handle, q.user)) : []
  if (q.user && !u) return null
  const [th] = q.theme
    ? await db
        .select({ id: s.themes.id, title: s.themes.title, host: s.hosts.name })
        .from(s.themes)
        .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
        .where(eq(s.themes.id, q.theme))
    : []
  if (q.theme && !th) return null
  if (u)
    return {
      name: u.name,
      line: th ? `${th.title} 참여자` : u.origin ? `${u.origin} 출발` : '참여자',
      person: true,
      back: th ? `/trips/${th.id}/members` : `/users/${u.handle}`,
      userId: u.id,
      handle: u.handle,
      themeId: th?.id ?? null,
    }
  if (th)
    return {
      name: th.title,
      line: `${th.host} 호스트의 테마`,
      person: false,
      back: `/themes/${th.id}`,
      userId: null,
      handle: null,
      themeId: th.id,
    }
  return {
    name: '운영팀',
    line: '추가 내용 · 이의제기',
    person: false,
    back: '/my/blocks',
    userId: null,
    handle: null,
    themeId: null,
  }
}

// ── 신고·차단 내역 ───────────────────────────────────
const reportBadge = (st: (typeof s.reportStatus.enumValues)[number]): [BadgeTone, string] =>
  st === '검토 중'
    ? ['soft', '관리자 확인 중']
    : st === '처리 완료'
      ? ['ink', '처리 완료']
      : ['muted', '반려']

export async function blocksAndReports(db: AnyDb, userId: string) {
  const [blocks, reports] = await Promise.all([
    db
      .select({ id: s.users.id, name: s.users.name, handle: s.users.handle, at: s.blocks.createdAt })
      .from(s.blocks)
      .innerJoin(s.users, eq(s.users.id, s.blocks.blockedId))
      .where(eq(s.blocks.userId, userId))
      .orderBy(desc(s.blocks.createdAt)),
    db.select().from(s.reports).where(eq(s.reports.reporterId, userId)).orderBy(desc(s.reports.createdAt)),
  ])
  return {
    blocks: blocks.map((b) => ({ ...b, when: `${mdKo(b.at)} 차단` })),
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      badge: reportBadge(r.status),
      when: `${mdKo(r.createdAt)} 접수`,
    })),
  }
}

export async function isBlocked(db: AnyDb, userId: string, blockedId: string) {
  const [r] = await db
    .select({ u: s.blocks.userId })
    .from(s.blocks)
    .where(and(eq(s.blocks.userId, userId), eq(s.blocks.blockedId, blockedId)))
  return !!r
}
