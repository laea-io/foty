import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { freeHandle } from '@/app/actions/auth'
import { db, schema } from '@/lib/db'
import { env } from '@/lib/env'
import { startSession } from '@/lib/server/auth'

type KakaoMe = { id: number; kakao_account?: { profile?: { nickname?: string } } }

/** 카카오가 돌려보낸 곳: code → 토큰 → 사용자 → 세션. 처음이면 가입(성향 화면으로) */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const back = (p: string) => NextResponse.redirect(new URL(p, env.APP_URL))
  const jar = await cookies()
  const [state, next] = (jar.get('foty_oauth')?.value ?? '').split('|')
  jar.set('foty_oauth', '', { path: '/', maxAge: 0 })
  const code = url.searchParams.get('code')
  if (!env.KAKAO_REST_KEY || !code || !state || state !== url.searchParams.get('state'))
    return back('/login?kakao=fail')

  const token = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.KAKAO_REST_KEY,
      redirect_uri: `${env.APP_URL}/api/auth/kakao/callback`,
      code,
      ...(env.KAKAO_CLIENT_SECRET ? { client_secret: env.KAKAO_CLIENT_SECRET } : {}),
    }),
  }).then((r) => (r.ok ? (r.json() as Promise<{ access_token: string }>) : null))
  if (!token?.access_token) return back('/login?kakao=fail')
  const me = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { authorization: `Bearer ${token.access_token}` },
  }).then((r) => (r.ok ? (r.json() as Promise<KakaoMe>) : null))
  if (!me?.id) return back('/login?kakao=fail')

  const kakaoId = String(me.id)
  let [u] = await db.select().from(schema.users).where(eq(schema.users.kakaoId, kakaoId))
  if (!u) {
    ;[u] = await db
      .insert(schema.users)
      .values({
        handle: await freeHandle(`k${kakaoId.slice(-6)}`),
        name: (me.kakao_account?.profile?.nickname ?? '여행자').slice(0, 20),
        kakaoId,
      })
      .returning()
  }
  await startSession(u.id)
  return back(u.onboarded ? next || '/' : `/onboarding?next=${encodeURIComponent(next || '/')}`)
}
