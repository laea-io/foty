import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from './schema'

// 개발 중 핫 리로드마다 연결이 새로 생기지 않게 전역에 하나만.
const g = globalThis as unknown as { pg?: ReturnType<typeof postgres> }

export const sql =
  g.pg ??
  postgres(env.DATABASE_URL, {
    max: 5, // cortie-db는 여러 제품이 같이 쓴다 — 연결을 적게
    idle_timeout: 30,
    ssl: env.DATABASE_SSL === 'require' ? 'require' : false,
  })
if (env.NODE_ENV !== 'production') g.pg = sql

export const db = drizzle(sql, { schema, casing: 'snake_case' })
export type Db = typeof db
export { schema }
