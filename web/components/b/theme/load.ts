import { notFound } from 'next/navigation'
import { themeById, themes } from '@/lib/demo/themes'

/** 테마 주소의 [id] → 테마. 없으면 404 */
export async function loadTheme(params: Promise<{ id: string }>) {
  const t = themeById((await params).id)
  if (!t) notFound()
  return t
}

export const themeParams = () => themes.map((t) => ({ id: t.id }))
