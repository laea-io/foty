import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { safeNext } from '@/lib/server/auth'
import { randomToken } from '@/lib/server/crypto'

/** 카카오 로그인 시작. KAKAO_REST_KEY가 없으면 로그인 화면으로 돌려보낸다 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  if (!env.KAKAO_REST_KEY) return NextResponse.redirect(new URL('/login?kakao=off', env.APP_URL))
  const state = randomToken(16)
  const jar = await cookies()
  jar.set('foty_oauth', `${state}|${safeNext(url.searchParams.get('next'))}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.APP_URL.startsWith('https://'),
    path: '/',
    maxAge: 600,
  })
  const q = new URLSearchParams({
    client_id: env.KAKAO_REST_KEY,
    redirect_uri: `${env.APP_URL}/api/auth/kakao/callback`,
    response_type: 'code',
    state,
  })
  return NextResponse.redirect(`https://kauth.kakao.com/oauth/authorize?${q}`)
}
