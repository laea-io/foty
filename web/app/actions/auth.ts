'use server'

import { eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db, schema } from '@/lib/db'
import { env } from '@/lib/env'
import { endSession, safeNext, startSession } from '@/lib/server/auth'
import { hashPassword, verifyPassword } from '@/lib/server/crypto'

export type AuthState = { error?: string } | undefined

const email = z.string().trim().toLowerCase().email('이메일 주소를 확인해 주세요')
const password = z.string().min(8, '비밀번호는 8자 이상이에요').max(200)

/** 이메일 로그인 */
export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const e = email.safeParse(form.get('email'))
  const p = z.string().min(1).safeParse(form.get('password'))
  if (!e.success || !p.success) return { error: '이메일과 비밀번호를 확인해 주세요' }
  const [u] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${e.data}`)
  if (!u || !(await verifyPassword(p.data, u.passwordHash)))
    return { error: '이메일 또는 비밀번호가 맞지 않아요' }
  if (u.suspendedAt) return { error: '이용이 정지된 계정이에요. 운영팀에 문의해 주세요' }
  await startSession(u.id)
  redirect(safeNext(form.get('next'), u.onboarded ? '/' : '/onboarding'))
}

/** 이메일 가입 — 닉네임 · 성인 확인 · 동의 */
export async function signupAction(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      email,
      password,
      name: z.string().trim().min(1, '닉네임을 적어 주세요').max(20, '닉네임은 20자까지예요'),
      adult: z.literal('on', { message: '만 19세 이상만 가입할 수 있어요' }),
      terms: z.literal('on', { message: '이용약관과 개인정보 처리에 동의해 주세요' }),
    })
    .safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력을 확인해 주세요' }
  const d = parsed.data
  const [dup] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${d.email}`)
  if (dup) return { error: '이미 가입한 이메일이에요. 로그인해 주세요' }
  const [u] = await db
    .insert(schema.users)
    .values({
      handle: await freeHandle(d.email.split('@')[0]),
      name: d.name,
      email: d.email,
      passwordHash: await hashPassword(d.password),
      adult: true,
    })
    .returning()
  await startSession(u.id)
  redirect(`/onboarding?next=${encodeURIComponent(safeNext(form.get('next')))}`)
}

export async function logoutAction() {
  await endSession()
  redirect('/')
}

/** 스테이징 시연: 시연 계정으로 바로 들어가기(DEMO_MODE=1에서만) */
export async function demoLoginAction(form: FormData) {
  if (env.DEMO_MODE !== '1') redirect('/login')
  const handle = String(form.get('as') ?? 'kanghyun')
  const [u] = await db.select().from(schema.users).where(eq(schema.users.handle, handle))
  if (!u?.demo) redirect('/login')
  await startSession(u.id)
  redirect(
    safeNext(
      form.get('next'),
      handle.endsWith('-owner') || ['harin', 'jiho', 'seoyeon'].includes(handle) ? '/host' : '/',
    ),
  )
}

/** 주소에 쓸 이름(영문·숫자) — 겹치면 숫자를 붙인다 */
export async function freeHandle(seed: string) {
  const base =
    seed
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16) || 'user'
  for (let i = 0; i < 50; i++) {
    const h = i ? `${base}${i + 1}` : base
    const [x] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.handle, h))
    if (!x) return h
  }
  return `${base}${Date.now().toString(36)}`
}
