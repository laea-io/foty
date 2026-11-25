import 'server-only'
import { db, sql } from '@/lib/db'
import { tick } from '@/lib/server/domain/flow'

const LOCK = 4060_2111 // pg advisory lock 번호 — 인스턴스가 늘어도 한 곳만 돈다

/** 1분마다 상태 넘기기(마감 → 조율 시작/자동 취소, 여행 끝 → 완료) */
export function startJobs() {
  const g = globalThis as unknown as { fotyJobs?: NodeJS.Timeout }
  if (g.fotyJobs) return
  const run = async () => {
    // 잠금은 세션 단위라 같은 연결에서 잡고 풀어야 한다
    const conn = await sql.reserve()
    try {
      const [{ ok }] = await conn<{ ok: boolean }[]>`select pg_try_advisory_lock(${LOCK}) as ok`
      if (!ok) return
      try {
        const r = await tick(db)
        if (r.closed) console.log(`[foty] jobs: ${r.closed} theme(s) past deadline`)
      } finally {
        await conn`select pg_advisory_unlock(${LOCK})`
      }
    } catch (e) {
      console.error('[foty] jobs failed', e)
    } finally {
      conn.release()
    }
  }
  g.fotyJobs = setInterval(run, 60_000)
  setTimeout(run, 5_000)
}
