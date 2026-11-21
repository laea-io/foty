import 'server-only'
import { notFound } from 'next/navigation'
import { themeDetail } from '@/lib/server/q/themes'

/** 테마 주소의 [id] → DB의 테마 + 보는 사람 + 관계. 없으면 404 */
export async function loadThemeCtx(params: Promise<{ id: string }>) {
  const d = await themeDetail((await params).id)
  if (!d) notFound()
  return d
}

/** 테마만 */
export async function loadTheme(params: Promise<{ id: string }>) {
  return (await loadThemeCtx(params)).theme
}
