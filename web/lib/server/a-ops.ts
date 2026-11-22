// 그룹 A(가입·마이·공통) 쓰기 — db를 첫 인자로 받는 순수 함수. 서버 액션(app/actions/a.ts)이 권한을 확인한 뒤 부른다.
import { and, eq, gte, inArray, isNull, notInArray } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { cancelApplication, hostCancel } from './domain/flow'
import { notify, systemMessage } from './domain/notify'
import { type AnyDb, FlowError } from './domain/types'
import { hashPassword, verifyPassword } from './password'
import { rules } from './rules'
import { today } from './time'

// ── 가입 단계 ────────────────────────────────────────
export type OnboardingPatch = {
  prefs?: Partial<s.Prefs>
  name?: string
  origin?: string | null
  adult?: boolean
  mbti?: string | null
  mbtiPublic?: boolean
  onboarded?: boolean
}

const MBTI = /^[EI][NS][FT][JP]$/

/** 성향은 기존 값에 덧붙인다(빈 값은 지우기) */
export async function saveOnboarding(db: AnyDb, userId: string, patch: OnboardingPatch) {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId))
  if (!u) throw new FlowError('not-found', '사용자를 찾을 수 없어요')
  const set: Partial<typeof s.users.$inferInsert> = {}
  if (patch.prefs) {
    const next: s.Prefs = { ...u.prefs }
    for (const [k, v] of Object.entries(patch.prefs) as [keyof s.Prefs, string | string[] | undefined][]) {
      if (v === undefined || (Array.isArray(v) ? !v.length : !v)) delete next[k]
      else (next as Record<string, unknown>)[k] = v
    }
    set.prefs = next
  }
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) throw new FlowError('name', '닉네임을 적어 주세요')
    if (name.length > 20) throw new FlowError('name', '닉네임은 20자까지예요')
    set.name = name
  }
  if (patch.origin !== undefined) set.origin = patch.origin?.trim() || null
  if (patch.adult !== undefined) {
    if (!patch.adult) throw new FlowError('adult', '만 19세 이상만 이용할 수 있어요')
    set.adult = true
  }
  if (patch.mbti !== undefined) {
    const m = patch.mbti?.toUpperCase() ?? null
    if (m && m !== '?' && !MBTI.test(m)) throw new FlowError('mbti', 'MBTI를 다시 골라 주세요')
    set.mbti = m && m !== '?' ? m : null
  }
  if (patch.mbtiPublic !== undefined) set.mbtiPublic = patch.mbtiPublic
  if (patch.onboarded !== undefined) set.onboarded = patch.onboarded
  if (Object.keys(set).length) await db.update(s.users).set(set).where(eq(s.users.id, userId))
}

// ── 공개 범위 ────────────────────────────────────────
/** 화면의 스위치 → 저장 위치. reviewsPublic은 Privacy 타입에 아직 없어 jsonb에 덧붙인다(보고함) */
export const PRIVACY_KEYS = [
  'photosPublic',
  'mbtiPublic',
  'profilePublic',
  'tripsPublic',
  'reviewsPublic',
] as const
export type PrivacyKey = (typeof PRIVACY_KEYS)[number]
export type PrivacyState = Record<PrivacyKey, boolean>

export function privacyState(u: Pick<typeof s.users.$inferSelect, 'privacy' | 'mbtiPublic'>): PrivacyState {
  const p = u.privacy as s.Privacy & { reviewsPublic?: boolean }
  return {
    photosPublic: p.photosPublic ?? false,
    mbtiPublic: u.mbtiPublic,
    profilePublic: p.profilePublic ?? true,
    tripsPublic: p.tripsPublic ?? true,
    reviewsPublic: p.reviewsPublic ?? true,
  }
}

export async function savePrivacy(db: AnyDb, userId: string, key: PrivacyKey, value: boolean) {
  if (!PRIVACY_KEYS.includes(key)) throw new FlowError('key', '바꿀 수 없는 항목이에요')
  if (key === 'mbtiPublic') {
    await db.update(s.users).set({ mbtiPublic: value }).where(eq(s.users.id, userId))
    return
  }
  const [u] = await db.select({ privacy: s.users.privacy }).from(s.users).where(eq(s.users.id, userId))
  if (!u) throw new FlowError('not-found', '사용자를 찾을 수 없어요')
  await db
    .update(s.users)
    .set({ privacy: { ...u.privacy, [key]: value } as s.Privacy })
    .where(eq(s.users.id, userId))
}

// ── 차단 ─────────────────────────────────────────────
export async function setBlock(db: AnyDb, userId: string, blockedId: string, on: boolean) {
  if (userId === blockedId) throw new FlowError('self', '나를 차단할 수는 없어요')
  if (on) await db.insert(s.blocks).values({ userId, blockedId }).onConflictDoNothing()
  else await db.delete(s.blocks).where(and(eq(s.blocks.userId, userId), eq(s.blocks.blockedId, blockedId)))
}

// ── 구독(새 테마 알림) ───────────────────────────────
export async function setSubscription(db: AnyDb, userId: string, kind: string, key: string, on: boolean) {
  if (!['all', 'host', 'place'].includes(kind)) throw new FlowError('kind', '알림 종류를 확인해 주세요')
  if (on) await db.insert(s.subscriptions).values({ userId, kind, key }).onConflictDoNothing()
  else
    await db
      .delete(s.subscriptions)
      .where(
        and(eq(s.subscriptions.userId, userId), eq(s.subscriptions.kind, kind), eq(s.subscriptions.key, key)),
      )
}

// ── 알림 ─────────────────────────────────────────────
/** 읽음 처리(ids가 없으면 전부) */
export async function markRead(db: AnyDb, userId: string, ids?: string[], now = new Date()) {
  const conds = [eq(s.notifications.userId, userId), isNull(s.notifications.readAt)]
  if (ids) {
    if (!ids.length) return
    conds.push(inArray(s.notifications.id, ids))
  }
  await db
    .update(s.notifications)
    .set({ readAt: now })
    .where(and(...conds))
}

// ── 신고 ─────────────────────────────────────────────
export async function fileReport(
  db: AnyDb,
  input: {
    reporterId: string
    targetUserId?: string | null
    targetThemeId?: string | null
    reason: string
    detail?: string
    block?: boolean
  },
) {
  if (!rules.reportReasons.includes(input.reason)) throw new FlowError('reason', '신고 사유를 골라 주세요')
  if (input.targetUserId === input.reporterId) throw new FlowError('self', '나를 신고할 수는 없어요')
  const detail = (input.detail ?? '').trim().slice(0, 1000)
  const [r] = await db
    .insert(s.reports)
    .values({
      reporterId: input.reporterId,
      targetUserId: input.targetUserId ?? null,
      targetThemeId: input.targetThemeId ?? null,
      reason: input.reason,
      detail,
    })
    .returning()
  if (input.block && input.targetUserId) await setBlock(db, input.reporterId, input.targetUserId, true)
  const admins = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.role, 'admin'))
  await notify(
    db,
    admins.map((a) => a.id),
    { title: '새 신고가 들어왔어요', body: input.reason, href: '/admin#reports' },
  )
  return r
}

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

const isDeleted = (u: { handle: string }) => u.handle.startsWith('deleted-')

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

// ── 계정 ─────────────────────────────────────────────
/** 비밀번호 바꾸기. 카카오로만 가입해 비밀번호가 없으면 지금 비밀번호 없이 새로 정한다 */
export async function changePassword(db: AnyDb, userId: string, current: string, next: string) {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId))
  if (!u) throw new FlowError('not-found', '사용자를 찾을 수 없어요')
  if (u.passwordHash && !(await verifyPassword(current, u.passwordHash)))
    throw new FlowError('current', '지금 비밀번호가 맞지 않아요')
  if (next.length < 8) throw new FlowError('short', '새 비밀번호는 8자 이상이에요')
  if (next.length > 200) throw new FlowError('long', '새 비밀번호가 너무 길어요')
  await db
    .update(s.users)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(s.users.id, userId))
}

const ENDED = ['취소', '여행 완료'] as const

/**
 * 탈퇴(되돌릴 수 없음) — 행은 남기고(대화·후기의 작성자) 알아볼 수 있는 정보를 지운다.
 * 앞으로의 신청은 취소(성사 뒤라 일반 취소가 안 되면 바로 취소하고 호스트·그룹에 알림),
 * 호스트였다면 앞으로의 테마를 취소하고 권한을 정지, 마지막으로 모든 세션을 끝낸다.
 */
export async function deleteAccount(db: AnyDb, userId: string, now = new Date()) {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId))
  if (!u) throw new FlowError('not-found', '사용자를 찾을 수 없어요')
  if (isDeleted(u)) throw new FlowError('deleted', '이미 탈퇴한 계정이에요')
  if (u.role === 'admin') throw new FlowError('admin', '운영팀 계정은 여기서 탈퇴할 수 없어요')
  const t = today(now)

  const apps = await db
    .select({ themeId: s.applications.themeId, title: s.themes.title, hostUser: s.hosts.userId })
    .from(s.applications)
    .innerJoin(s.themes, eq(s.themes.id, s.applications.themeId))
    .innerJoin(s.hosts, eq(s.hosts.id, s.themes.hostId))
    .where(
      and(
        eq(s.applications.userId, userId),
        inArray(s.applications.status, ['신청 대기', '수락']),
        notInArray(s.themes.status, [...ENDED]),
        gte(s.themes.day, t),
      ),
    )
  for (const a of apps) {
    try {
      await cancelApplication(db, { themeId: a.themeId, userId })
    } catch (e) {
      if (!(e instanceof FlowError)) throw e
      // 성사 뒤: 바로 빠지고 호스트·그룹에 알린다
      await db
        .update(s.applications)
        .set({ status: '신청 취소', decidedAt: now })
        .where(and(eq(s.applications.themeId, a.themeId), eq(s.applications.userId, userId)))
      await notify(db, [a.hostUser], {
        title: '참여자 한 명이 탈퇴했어요',
        body: a.title,
        href: `/host/themes/${a.themeId}/applicants`,
      })
      await systemMessage(db, a.themeId, '참여자 한 명이 탈퇴해 그룹에서 빠졌어요.')
    }
  }

  const [host] = await db.select().from(s.hosts).where(eq(s.hosts.userId, userId))
  if (host) {
    const own = await db
      .select({ id: s.themes.id })
      .from(s.themes)
      .where(and(eq(s.themes.hostId, host.id), notInArray(s.themes.status, [...ENDED]), gte(s.themes.day, t)))
    for (const th of own) await hostCancel(db, { themeId: th.id, hostUserId: userId, reason: '호스트 탈퇴' })
    await db.update(s.hosts).set({ status: '정지', contact: '' }).where(eq(s.hosts.id, host.id))
  }

  await db
    .update(s.users)
    .set({
      name: '탈퇴한 사용자',
      handle: `deleted-${userId.replace(/-/g, '').slice(0, 12)}`,
      email: null,
      kakaoId: null,
      passwordHash: null,
      origin: null,
      mbti: null,
      mbtiPublic: false,
      prefs: {},
      privacy: { profilePublic: false, tripsPublic: false, photosPublic: false, reviewsPublic: false },
      suspendedAt: now,
    })
    .where(eq(s.users.id, userId))
  await db.delete(s.subscriptions).where(eq(s.subscriptions.userId, userId))
  await db.delete(s.sessions).where(eq(s.sessions.userId, userId))
}
