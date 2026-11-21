import 'server-only'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireHost } from '../auth'
import { loadTheme } from '../domain/read'

/** 호스트 화면: 내 테마만(남의 테마면 없는 화면) */
export async function ownTheme(id: string, next: string) {
  const v = await requireHost(next)
  const t = await loadTheme(db, id)
  if (!t || t.hostId !== v.host.id) notFound()
  return { v, t }
}
