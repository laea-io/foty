// 로그인 세션 — 쿠키 + DB 세션, 보는 사람(Viewer), 권한 확인(로그인·호스트·운영팀)
import 'server-only'
import { and, eq, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db, schema } from '@/lib/db'
import { env } from '@/lib/env'
import { randomToken, sha256 } from '@/lib/server/auth/crypto'

const COOKIE = 'foty_session'
const DAYS = 30

export type Viewer = typeof schema.users.$inferSelect & { host: typeof schema.hosts.$inferSelect | null }

/** 로그인 세션 만들기 + 쿠키 */
export async function startSession(userId: string) {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + DAYS * 86400000)
  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt })
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.APP_URL.startsWith('https://'),
    path: '/',
    expires: expiresAt,
  })
}

/** 로그아웃: 세션 행을 지우고 쿠키를 비운다 */
export async function endSession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)))
  jar.set(COOKIE, '', { path: '/', maxAge: 0 })
}

/** 지금 보는 사람(없으면 null). 요청 하나 안에서는 한 번만 조회한다 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const row = await db
    .select({ user: schema.users, host: schema.hosts })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .leftJoin(schema.hosts, eq(schema.hosts.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1)
  if (!row[0] || row[0].user.suspendedAt) return null
  return { ...row[0].user, host: row[0].host }
})

/** 로그인이 필요한 화면: 없으면 /login?next=… 로 */
export async function requireViewer(next: string) {
  const v = await getViewer()
  if (!v) redirect(`/login?next=${encodeURIComponent(next)}`)
  return v
}

/** 호스트 등록을 한 사람만(확인 대기 포함). 테마 게시는 확인 완료만 — publish 쪽에서 막는다 */
export async function requireHost(next = '/host') {
  const v = await requireViewer(next)
  if (!v.host) redirect('/host/join')
  return v as Viewer & { host: NonNullable<Viewer['host']> }
}

export async function requireAdmin() {
  const v = await requireViewer('/admin')
  if (v.role !== 'admin') redirect('/')
  return v
}

/** 로그인 뒤 돌아갈 주소 — 같은 사이트 안의 경로만 */
export function safeNext(next: unknown, fallback = '/') {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
