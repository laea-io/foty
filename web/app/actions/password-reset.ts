'use server'

// 비밀번호 재설정 서버 액션(사용자 요청 · 새 비밀번호 · 운영팀 링크)
import { redirect } from 'next/navigation'
import { requestReset, resetLinkFor, resetPassword } from '@/lib/server/auth/reset'
import { requireAdmin } from '@/lib/server/auth/session'
import { act } from '@/lib/server/util/act'

type S = { error?: string; done?: boolean; link?: string } | undefined

export async function forgotAction(_: S, f: FormData): Promise<S> {
  const r = await act(() => requestReset(String(f.get('email') ?? '')))
  return r.ok ? { done: true } : { error: r.error }
}

export async function resetAction(_: S, f: FormData): Promise<S> {
  const pw = String(f.get('password') ?? '')
  if (pw !== String(f.get('password2') ?? '')) return { error: '두 비밀번호가 달라요' }
  const r = await act(() => resetPassword(String(f.get('token') ?? ''), pw))
  if (!r.ok) return { error: r.error }
  redirect('/login?reset=1')
}

/** 운영팀: 메일이 없을 때 사용자에게 직접 전할 재설정 링크 */
export async function adminResetLinkAction(_: S, f: FormData): Promise<S> {
  await requireAdmin()
  const r = await act(() => resetLinkFor(String(f.get('userId') ?? '')))
  return r.ok ? { link: r.data } : { error: r.error }
}
