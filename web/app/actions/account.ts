'use server'

// 계정 서버 액션 — 권한 확인 → 입력 검사 → lib/server/domain/account → revalidate/redirect
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { type AuthState, signupAction } from '@/app/actions/auth'
import { db, schema } from '@/lib/db'
import { endSession, requireViewer, safeNext } from '@/lib/server/auth/session'
import {
  changePassword,
  deleteAccount,
  fileReport,
  markRead,
  PRIVACY_KEYS,
  type PrivacyKey,
  saveOnboarding,
  savePrivacy,
  setBlock,
  setSubscription,
} from '@/lib/server/domain/account'
import { FlowError } from '@/lib/server/domain/types'
import { type ActResult, act } from '@/lib/server/util/act'
import { type FormState, text, withNext } from '@/lib/server/util/form'
import { findStation } from '@/lib/shared/stations'

// ── 가입 단계 ────────────────────────────────────────
/** 가입 단계 저장. step = 1 · 2 · 3 · mbti. skip이면 저장 없이 끝내기(다시 묻지 않게 onboarded만 켠다) */
export async function onboardingAction(_: FormState, form: FormData): Promise<FormState> {
  const step = text(form, 'step')
  const next = text(form, 'next')
  const v = await requireViewer(withNext(step === '1' ? '/onboarding' : `/onboarding/${step}`, next))
  const done = safeNext(next, '/')
  if (form.get('skip')) {
    await saveOnboarding(db, v.id, { onboarded: true })
    redirect(done)
  }
  // 이 폼에 실제로 있던 칩 묶음만 바꾼다(모바일·데스크톱 단계마다 묶음이 조금 다르다)
  const keys = new Set(form.getAll('_keys').map(String))
  const one = (k: string) => (keys.has(k) ? text(form, k) : undefined)
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
      // 출발역: 역 목록에 있는 이름만(홈 조건의 기본 출발지와 맞춘다). 비우면 그대로 둔다
      const raw = text(form, 'origin').trim()
      const station = raw ? (findStation(raw) ?? findStation(`${raw}역`)) : undefined
      if (raw && !station) throw new FlowError('origin', '출발역을 목록에서 골라 주세요')
      await saveOnboarding(db, v.id, {
        name: text(form, 'nickname'),
        adult: form.get('adult') === 'on',
        origin: station?.name,
        prefs: keys.has('transport') ? { transport: one('transport') } : undefined,
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
  // 가입 중일 때만 다음 단계로. 이미 가입한 사람이 마이에서 고친 거면 바로 돌아간다
  if ((step === '2' || step === 'mbti') && !v.onboarded) redirect(withNext('/onboarding/3', next))
  redirect(done)
}

/** 이메일 가입 — 비밀번호 확인 · 필수 동의 두 개를 본 뒤 공통 signupAction으로. 새 테마 알림(선택)은 가입 뒤 구독 */
export async function signupFormAction(state: AuthState, form: FormData): Promise<AuthState> {
  if (text(form, 'password') !== text(form, 'password2')) return { error: '비밀번호가 서로 달라요' }
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
      const email = text(form, 'email').toLowerCase()
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
  const user = text(form, 'user')
  const theme = text(form, 'theme')
  const qs = new URLSearchParams()
  if (user) qs.set('user', user)
  if (theme) qs.set('theme', theme)
  const v = await requireViewer(`/report${qs.size ? `?${qs}` : ''}`)
  const reason = text(form, 'reason')
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
      detail: text(form, 'detail'),
      block: form.get('block') === 'on',
    }),
  )
  if (!r.ok) return { error: r.error }
  revalidatePath('/my/blocks')
  redirect('/report?done=1')
}

// ── 계정 ─────────────────────────────────────────────
/** 비밀번호 바꾸기(비밀번호가 없던 카카오 계정은 새로 정하기) */
export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer('/my/account')
  const next = text(form, 'next')
  if (next !== text(form, 'next2')) return { error: '새 비밀번호가 서로 달라요' }
  const r = await act(() => changePassword(db, v.id, text(form, 'current'), next))
  if (!r.ok) return { error: r.error }
  redirect('/my/account?pw=1')
}

/** 탈퇴 — "탈퇴"를 그대로 적어야 한다. 정보를 지우고 세션을 끝낸 뒤 로그인 화면으로 */
export async function deleteAccountAction(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer('/my/account')
  if (text(form, 'confirm') !== '탈퇴') return { error: '확인 칸에 "탈퇴"를 그대로 적어 주세요' }
  const r = await act(() => deleteAccount(db, v.id))
  if (!r.ok) return { error: r.error }
  await endSession()
  redirect('/login?deleted=1')
}
