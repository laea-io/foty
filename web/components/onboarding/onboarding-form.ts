// 가입 단계 화면이 같이 쓰는 값(초기값 · next 주소)
import type { Prefs } from '@/lib/db/schema'

type SP = Record<string, string | string[] | undefined>

/** ?next= (같은 사이트 경로만) — 없으면 '' */
export function nextOf(sp: SP) {
  const v = Array.isArray(sp.next) ? sp.next[0] : sp.next
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : ''
}

export const withNext = (path: string, next: string) =>
  next ? `${path}?next=${encodeURIComponent(next)}` : path

/** 저장된 값이 있으면 그것, 없으면 디자인의 기본 선택 */
export function pick(prefs: Prefs, key: keyof Prefs, fallback: string[]): string[] {
  const v = prefs[key]
  if (Array.isArray(v)) return v.length ? v : fallback
  return v ? [v] : fallback
}
