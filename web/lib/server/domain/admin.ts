// 운영팀 쓰기 — 호스트 확인, 신고 처리, 정지, 숨김, 테마 취소, 참여 확인.
import { and, eq } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { hostCancel } from '@/lib/server/domain/flow'
import { notify } from '@/lib/server/domain/notify'
import { type AnyDb, FlowError } from '@/lib/server/domain/types'

// ── 운영팀 ───────────────────────────────────────────
/** 호스트 확인 완료 / 보류 — 호스트에게 알린다. 보류 사유(reason)가 있으면 알림에 그대로 담는다 */
export async function decideHost(db: AnyDb, hostId: string, ok: boolean, now = new Date(), reason = '') {
  const [h] = await db.select().from(s.hosts).where(eq(s.hosts.id, hostId))
  if (!h) throw new FlowError('not-found', '호스트를 찾을 수 없어요')
  if (h.status !== '확인 대기' && h.status !== '보류') throw new FlowError('state', '이미 처리된 호스트예요')
  await db
    .update(s.hosts)
    .set(ok ? { status: '확인 완료', verifiedAt: now } : { status: '보류', verifiedAt: null })
    .where(eq(s.hosts.id, hostId))
  await notify(
    db,
    [h.userId],
    ok
      ? {
          title: '호스트 확인이 끝났어요',
          body:
            h.kind === 'business'
              ? '사업장 확인이 끝나 테마를 열 수 있어요.'
              : '남양주 주민 인증이 끝나 테마를 열 수 있어요.',
          href: '/host',
        }
      : {
          title: '호스트 확인이 보류됐어요',
          body: reason.trim()
            ? `보류 사유: ${reason.trim().slice(0, 300)}`
            : '운영팀이 더 확인할 내용이 있어요. 안내를 확인해 주세요.',
          href: '/host/join',
        },
  )
}

/** 신고 처리 완료 / 반려. 불참 신고를 처리하면 그 테마의 참여 기록을 "불참 확인"으로 */
export async function resolveReport(db: AnyDb, reportId: string, done: boolean, now = new Date()) {
  const [r] = await db.select().from(s.reports).where(eq(s.reports.id, reportId))
  if (!r) throw new FlowError('not-found', '신고를 찾을 수 없어요')
  if (r.status !== '검토 중') throw new FlowError('state', '이미 처리된 신고예요')
  await db
    .update(s.reports)
    .set({ status: done ? '처리 완료' : '반려', resolvedAt: now })
    .where(eq(s.reports.id, reportId))
  if (done && r.reason === '약속 시간 불참' && r.targetThemeId && r.targetUserId) {
    await db
      .insert(s.attendance)
      .values({
        themeId: r.targetThemeId,
        userId: r.targetUserId,
        status: '불참 확인',
        note: '신고 확인',
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [s.attendance.themeId, s.attendance.userId],
        set: { status: '불참 확인', note: '신고 확인', updatedAt: now },
      })
  }
  await notify(db, [r.reporterId], {
    title: '신고 처리 결과를 알려드려요',
    body: `${r.reason} · ${done ? '처리 완료' : '반려'}`,
    href: '/my/blocks',
  })
}

/** 호스트 권한 정지 / 해제. 정지된 호스트는 새 테마를 열 수 없다(모집 중 테마는 그대로) */
export async function setHostSuspended(db: AnyDb, hostId: string, on: boolean, reason = '') {
  const [h] = await db.select().from(s.hosts).where(eq(s.hosts.id, hostId))
  if (!h) throw new FlowError('not-found', '호스트를 찾을 수 없어요')
  if (on) {
    if (h.status === '정지') throw new FlowError('state', '이미 정지된 호스트예요')
    await db.update(s.hosts).set({ status: '정지' }).where(eq(s.hosts.id, hostId))
    await notify(db, [h.userId], {
      title: '호스트 권한이 정지됐어요',
      body: reason.trim() ? `정지 사유: ${reason.trim().slice(0, 300)}` : '새 테마를 열 수 없어요.',
      href: '/host/join',
    })
    return
  }
  if (h.status !== '정지') throw new FlowError('state', '정지된 호스트가 아니에요')
  // 확인을 받은 적이 있으면 확인 완료로, 아니면 다시 확인 대기로
  await db
    .update(s.hosts)
    .set({ status: h.verifiedAt ? '확인 완료' : '확인 대기' })
    .where(eq(s.hosts.id, hostId))
  await notify(db, [h.userId], {
    title: '호스트 권한이 다시 열렸어요',
    body: h.verifiedAt ? '다시 테마를 열 수 있어요.' : '운영팀 확인 뒤 테마를 열 수 있어요.',
    href: '/host',
  })
}

export const isDeleted = (u: { handle: string }) => u.handle.startsWith('deleted-')

/** 사용자 정지 / 해제. 정지하면 모든 세션을 끝내고 로그인을 막는다(운영팀·탈퇴한 사람은 바꾸지 않는다) */
export async function setUserSuspended(db: AnyDb, userId: string, on: boolean, now = new Date()) {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId))
  if (!u) throw new FlowError('not-found', '사용자를 찾을 수 없어요')
  if (u.role === 'admin') throw new FlowError('admin', '운영팀 계정은 정지할 수 없어요')
  if (isDeleted(u)) throw new FlowError('deleted', '탈퇴한 사용자예요')
  await db
    .update(s.users)
    .set({ suspendedAt: on ? now : null })
    .where(eq(s.users.id, userId))
  if (on) await db.delete(s.sessions).where(eq(s.sessions.userId, userId))
}

/** 글 숨기기 / 다시 보이기 */
export async function setPostHidden(db: AnyDb, postId: string, on: boolean, now = new Date()) {
  const r = await db
    .update(s.posts)
    .set({ hiddenAt: on ? now : null })
    .where(eq(s.posts.id, postId))
    .returning({ id: s.posts.id })
  if (!r.length) throw new FlowError('not-found', '글을 찾을 수 없어요')
}

/** 댓글 숨기기 / 다시 보이기 */
export async function setCommentHidden(db: AnyDb, commentId: string, on: boolean, now = new Date()) {
  const r = await db
    .update(s.comments)
    .set({ hiddenAt: on ? now : null })
    .where(eq(s.comments.id, commentId))
    .returning({ id: s.comments.id })
  if (!r.length) throw new FlowError('not-found', '댓글을 찾을 수 없어요')
}

/** 운영팀이 테마 취소 — 호스트 취소(flow.hostCancel)를 그대로 쓰고, 호스트에게도 알린다 */
export async function adminCancelTheme(db: AnyDb, themeId: string, reason: string) {
  const why = reason.trim().slice(0, 300)
  if (!why) throw new FlowError('reason', '취소 사유를 적어 주세요')
  const [row] = await db
    .select({ title: s.themes.title, hostUser: s.hosts.userId })
    .from(s.themes)
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(eq(s.themes.id, themeId))
  if (!row) throw new FlowError('not-found', '테마를 찾을 수 없어요')
  await hostCancel(db, { themeId, hostUserId: row.hostUser, reason: '운영팀 취소', message: why })
  await notify(db, [row.hostUser], {
    title: '운영팀이 테마를 취소했어요',
    body: `${row.title} · ${why}`,
    href: '/host',
  })
}

/** 참여 기록 검토(검토 중 → 참여 확인 / 불참 확인) */
export async function decideAttendance(
  db: AnyDb,
  input: { themeId: string; userId: string; attended: boolean },
  now = new Date(),
) {
  const where = and(eq(s.attendance.themeId, input.themeId), eq(s.attendance.userId, input.userId))
  const [a] = await db.select().from(s.attendance).where(where)
  if (a?.status !== '검토 중') throw new FlowError('state', '검토 중인 참여 기록이 아니에요')
  await db
    .update(s.attendance)
    .set({ status: input.attended ? '참여 확인' : '불참 확인', note: '운영팀 확인', updatedAt: now })
    .where(where)
}
