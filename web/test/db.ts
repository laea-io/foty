// 시험용 DB: 메모리 안의 Postgres(PGlite)에 실제 마이그레이션 + 시연 세계
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '@/lib/db/schema'
import { seedDemo } from '@/lib/db/seed-data'
import type { AnyDb } from '@/lib/server/domain/types'

/** 시험 기준 시각: 2026-11-21(토) 12:00 KST → 이번 주말 = 11-28 */
export const NOW = new Date('2026-11-21T12:00:00+09:00')

export async function testDb() {
  const client = new PGlite()
  const db = drizzle(client, { schema, casing: 'snake_case' })
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../drizzle') })
  const seeded = await seedDemo(db as unknown as AnyDb, { now: NOW })
  const uid = async (handle: string) => {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.handle, handle))
    return u.id
  }
  return { db: db as unknown as AnyDb, client, uid, seeded }
}
