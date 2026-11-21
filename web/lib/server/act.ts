import 'server-only'
import { FlowError } from './domain/types'

/** 서버 액션 결과 — 화면은 error 문장을 그대로 보여 준다 */
export type ActResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; code?: string }

/** 도메인 실패(FlowError)는 문장으로, 그 밖의 실패는 일반 안내로 바꾼다 */
export async function act<T>(fn: () => Promise<T>): Promise<ActResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    // redirect()·notFound()는 그대로 던진다
    if (
      e &&
      typeof e === 'object' &&
      'digest' in e &&
      String((e as { digest: unknown }).digest).startsWith('NEXT_')
    )
      throw e
    if (e instanceof FlowError) return { ok: false, error: e.message, code: e.code }
    console.error('[foty] action failed', e)
    return { ok: false, error: '잠시 문제가 생겼어요. 다시 시도해 주세요.' }
  }
}
