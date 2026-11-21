import { notFound } from 'next/navigation'
import { themeById } from '@/lib/demo/themes'
import { memberById, spaceById, spaces } from '@/lib/demo/trips'

/** 그룹 공간 주소의 [id] → 공간 + 테마. 없으면 404 */
export function loadSpace(id: string) {
  const s = spaceById(id)
  const t = themeById(id)
  if (!s || !t) notFound()
  /** 확인 요청 카드(집결 시간 변경)는 광릉숲 여행에만 있다 */
  return { s, t, change: id === 'gwangneung-morning' }
}

export function loadMember(uid: string) {
  const m = memberById(uid)
  if (!m) notFound()
  return m
}

export const spaceParams = () => spaces.map((s) => ({ id: s.id }))
