'use server'

// 그룹 A 서버 액션 — 권한 확인 → 입력 검사 → lib/server/a-ops.ts → revalidate/redirect
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { type AuthState, signupAction } from '@/app/actions/auth'
import { db, schema } from '@/lib/db'
import {
  decideHost,
  fileReport,
  markRead,
  PRIVACY_KEYS,
  type PrivacyKey,
  resolveReport,
  saveOnboarding,
  savePrivacy,
  setBlock,
  setSubscription,
} from '@/lib/server/a-ops'
import { type ActResult, act } from '@/lib/server/act'
import { requireAdmin, requireViewer, safeNext } from '@/lib/server/auth'

export type FormState = { error?: string } | undefined

const str = (form: FormData, k: string) => {
  const v = form.get(k)
  return typeof v === 'string' ? v.trim() : ''
}
const withNext = (path: string, next: string) => (next ? `${path}?next=${encodeURIComponent(next)}` : path)

// ── 가입 단계 ────────────────────────────────────────
/** 가입 단계 저장. step = 1 · 2 · 3 · mbti. skip이면 저장 없이 끝내기(다시 묻지 않게 onboarded만 켠다) */
export async function onboardingAction(_: FormState, form: FormData): Promise<FormState> {
  const step = str(form, 'step')
  const next = str(form, 'next')
  const v = await requireViewer(withNext(step === '1' ? '/onboarding' : `/onboarding/${step}`, next))
  const done = safeNext(next, '/')
  if (form.get('skip')) {
    await saveOnboarding(db, v.id, { onboarded: true })
    redirect(done)
  }
  // 이 폼에 실제로 있던 칩 묶음만 바꾼다(모바일·데스크톱 단계마다 묶음이 조금 다르다)
  const keys = new Set(form.getAll('_keys').map(String))
  const one = (k: string) => (keys.has(k) ? str(form, k) : undefined)
  const r = await act(async () => {
    if (step === '1') {
      await saveOnboarding(db, v.id, {
        prefs: {
          activities: keys.has('activities') ? form.getAll('activities').map(String) : undefined,
          pace: one('pace'),
          walk: one('walk'),
          talk: one('talk'),
          plan: one('plan'),
        },
      })
    } else if (step === '2') {
      const origin = one('origin')
      await saveOnboarding(db, v.id, {
        name: str(form, 'nickname'),
        adult: form.get('adult') === 'on',
        origin: origin === '직접 입력' ? undefined : origin,
      })
    } else if (step === '3') {
      await saveOnboarding(db, v.id, {
        prefs: { plan: one('plan'), walk: one('walk'), food: one('food') },
        onboarded: true,
      })
    } else if (step === 'mbti') {
      await saveOnboarding(db, v.id, {
        mbti: one('mbti') || null,
        mbtiPublic: form.get('mbtiPublic') === 'on',
      })
    }
  })
  if (!r.ok) return { error: r.error }
  revalidatePath('/my')
  if (step === '1') redirect(withNext('/onboarding/2', next))
  if (step === '2' || step === 'mbti') redirect(withNext('/onboarding/3', next))
  redirect(done)
}

/** 이메일 가입 — 비밀번호 확인 · 필수 동의 두 개를 본 뒤 공통 signupAction으로. 새 테마 알림(선택)은 가입 뒤 구독 */
export async function signupFormAction(state: AuthState, form: FormData): Promise<AuthState> {
  if (str(form, 'password') !== str(form, 'password2')) return { error: '비밀번호가 서로 달라요' }
  const f = new FormData()
  for (const k of ['email', 'password', 'name', 'adult', 'next']) {
    const x = form.get(k)
    if (x !== null) f.set(k, x)
  }
  if (form.get('terms') === 'on' && form.get('privacy') === 'on') f.set('terms', 'on')
  try {
    return await signupAction(state, f)
  } catch (e) {
    // 성공하면 signupAction이 redirect를 던진다 — 그때 선택 알림을 켠다
    if (form.get('alerts') === 'on') {
      const email = str(form, 'email').toLowerCase()
      const [u] = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(sql`lower(${schema.users.email}) = ${email}`)
      if (u) await setSubscription(db, u.id, 'all', '', true)
    }
    throw e
  }
}

// ── 공개 범위 ────────────────────────────────────────
export async function savePrivacyAction(key: string, value: boolean): Promise<ActResult> {
  const v = await requireViewer('/my/privacy')
  if (!(PRIVACY_KEYS as readonly string[]).includes(key))
    return { ok: false, error: '바꿀 수 없는 항목이에요' }
  const r = await act(() => savePrivacy(db, v.id, key as PrivacyKey, !!value))
  revalidatePath('/my')
  return r.ok ? { ok: true } : r
}

// ── 차단 · 구독 ──────────────────────────────────────
export async function setBlockAction(blockedId: string, on: boolean): Promise<ActResult> {
  const v = await requireViewer('/my/blocks')
  if (!z.string().uuid().safeParse(blockedId).success) return { ok: false, error: '사용자를 찾을 수 없어요' }
  const r = await act(() => setBlock(db, v.id, blockedId, !!on))
  revalidatePath('/my/blocks')
  return r.ok ? { ok: true } : r
}

export async function setSubscriptionAction(kind: string, key: string, on: boolean): Promise<ActResult> {
  const v = await requireViewer('/my')
  const r = await act(() => setSubscription(db, v.id, kind, String(key).slice(0, 80), !!on))
  return r.ok ? { ok: true } : r
}

// ── 알림 ─────────────────────────────────────────────
export async function markReadAction(ids?: string[]): Promise<ActResult> {
  const v = await requireViewer('/notifications')
  const list = ids?.filter((x) => z.string().uuid().safeParse(x).success)
  const r = await act(() => markRead(db, v.id, list))
  return r.ok ? { ok: true } : r
}

// ── 신고 ─────────────────────────────────────────────
export async function reportAction(_: FormState, form: FormData): Promise<FormState> {
  const user = str(form, 'user')
  const theme = str(form, 'theme')
  const qs = new URLSearchParams()
  if (user) qs.set('user', user)
  if (theme) qs.set('theme', theme)
  const v = await requireViewer(`/report${qs.size ? `?${qs}` : ''}`)
  const reason = str(form, 'reason')
  if (!reason) return { error: '신고 사유를 골라 주세요' }
  const [target] = user
    ? await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.handle, user))
    : []
  if (user && !target) return { error: '신고할 사람을 찾을 수 없어요' }
  const r = await act(() =>
    fileReport(db, {
      reporterId: v.id,
      targetUserId: target?.id ?? null,
      targetThemeId: theme || null,
      reason,
      detail: str(form, 'detail'),
      block: form.get('block') === 'on',
    }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath('/my/blocks')
  redirect('/report?done=1')
}

// ── 운영팀 ───────────────────────────────────────────
export async function adminHostAction(form: FormData) {
  await requireAdmin()
  const r = await act(() => decideHost(db, str(form, 'hostId'), form.get('ok') === '1'))
  if (!r.ok) console.warn('[foty] admin host', r.error)
  revalidatePath('/admin')
}

export async function adminReportAction(form: FormData) {
  await requireAdmin()
  const r = await act(() => resolveReport(db, str(form, 'reportId'), form.get('done') === '1'))
  if (!r.ok) console.warn('[foty] admin report', r.error)
  revalidatePath('/admin')
}
