import { redirect } from 'next/navigation'
import { safeNext } from '@/lib/server/auth'

/** 예전 주소 — 이메일 로그인은 이제 /login 첫 화면에 있다 */
export default async function EmailLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = (await searchParams).next
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw)
  redirect(next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login')
}
