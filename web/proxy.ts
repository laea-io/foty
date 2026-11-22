// foty는 로그인한 뒤에만 쓸 수 있다(2026-11-22). 로그인·가입·상태 확인·정적 파일만 열어 두고,
// 나머지는 세션이 살아 있는지 DB로 확인해서 없으면 /login?next=… 로 보낸다(API는 401).
import { and, eq, gt } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { sha256 } from '@/lib/server/crypto'

const OPEN = [/^\/login(\/|$)/, /^\/signup(\/|$)/, /^\/credits$/, /^\/api\/health$/, /^\/robots\.txt$/]

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  if (OPEN.some((r) => r.test(path))) return NextResponse.next()
  const token = req.cookies.get('foty_session')?.value
  if (token) {
    const [row] = await db
      .select({ id: schema.sessions.id })
      .from(schema.sessions)
      .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
      .limit(1)
    if (row) return NextResponse.next()
  }
  if (path.startsWith('/api/')) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  const next = path + req.nextUrl.search
  if (next !== '/') url.searchParams.set('next', next)
  const res = NextResponse.redirect(url)
  if (token) res.cookies.set('foty_session', '', { path: '/', maxAge: 0 }) // 끝난 세션 쿠키 정리
  return res
}

export const config = {
  // Next 내부 파일·public(사진·글꼴)·아이콘은 거치지 않는다
  matcher: ['/((?!_next/|images/|fonts/|favicon\\.ico|icon|apple-icon).*)'],
}
