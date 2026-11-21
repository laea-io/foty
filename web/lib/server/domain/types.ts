// 도메인 함수는 DB를 인자로 받는다 — 운영은 postgres.js, 시험은 PGlite.
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import type * as schema from '@/lib/db/schema'

export type Schema = typeof schema
// biome-ignore lint/suspicious/noExplicitAny: 드라이버마다 결과 타입이 다르다
export type AnyDb =
  | PgDatabase<PgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>
  | PgDatabase<any, Schema>

/** 화면에 그대로 보여 줄 수 있는 실패 */
export class FlowError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
