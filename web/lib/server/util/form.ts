// 서버 액션에서 FormData 읽기 + 액션 결과 모양. 'use server' 파일은 async 함수만 내보낼 수 있어서 여기에 둔다.

/** 모든 서버 액션 폼의 결과(useActionState 상태) */
export type FormState = { error?: string; ok?: boolean; done?: boolean } | undefined

/** 그대로(앞뒤 공백 유지) */
export const str = (f: FormData, k: string) => String(f.get(k) ?? '')

/** 앞뒤 공백을 뺀 글 */
export const text = (f: FormData, k: string) => {
  const v = f.get(k)
  return typeof v === 'string' ? v.trim() : ''
}

/** 숫자만 골라 정수로(없으면 d) — "25,000원" → 25000 */
export const num = (f: FormData, k: string, d = 0) => {
  const n = Number.parseInt(str(f, k).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : d
}

/** act() 실패 → 폼 상태 */
export const fail = (r: { ok: false; error: string }) => ({ error: r.error })

/** 로그인 뒤 돌아갈 곳(next)을 붙인 주소 */
export const withNext = (path: string, next: string) =>
  next ? `${path}?next=${encodeURIComponent(next)}` : path
