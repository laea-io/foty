import 'server-only'
import { notFound } from 'next/navigation'
import type { SpaceData } from '@/components/trips/types'
import { loadSpace as load } from '@/lib/server/queries/trips'

/** 그룹 공간 주소의 [id] → 공간(그룹 사람만 · 아니면 404 · 비로그인은 로그인으로) */
export async function loadSpace(params: Promise<{ id: string }>, sub = ''): Promise<SpaceData> {
  const id = (await params).id
  return load(id, `/trips/${id}${sub}`)
}

/** 참여자 더보기의 [uid](handle) → 그룹 사람 */
export function memberOf(sp: SpaceData, uid: string) {
  const m = sp.members.find((x) => x.id === uid)
  if (!m) notFound()
  return m
}
