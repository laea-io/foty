// 계정 쓰기 — 가입 단계, 공개 설정, 차단·구독, 알림 읽음, 신고, 비밀번호 변경, 탈퇴. db를 첫 인자로 받는 순수 함수.
import { and, eq, gte, inArray, isNull, notInArray } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { hashPassword, verifyPassword } from '@/lib/server/auth/password'
import { isDeleted } from '@/lib/server/domain/admin'
import { cancelApplication, hostCancel } from '@/lib/server/domain/flow'
import { notify, systemMessage } from '@/lib/server/domain/notify'
import { type AnyDb, FlowError } from '@/lib/server/domain/types'
import { rules } from '@/lib/server/util/rules'
import { today } from '@/lib/server/util/time'

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
