// 개발·스테이징 DB에 마이그레이션 + 시연 세계 넣기: pnpm db:seed [--force]
// 운영 DB에는 돌리지 않는다(시연 계정이 생긴다).
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema'
import { seedDemo } from '@/lib/db/seed/data'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL이 필요해요')
if (/cortie-db|rds\.amazonaws|lightsail/i.test(url) && process.env.SEED_ALLOW_REMOTE !== '1')
  throw new Error('운영 DB로 보이는 주소예요. 시연 데이터는 넣지 않아요')

const sql = postgres(url, { max: 1, ssl: process.env.DATABASE_SSL === 'require' ? 'require' : false })
const db = drizzle(sql, { schema, casing: 'snake_case' })
await migrate(db, { migrationsFolder: './drizzle' })
const r = await seedDemo(db, { force: process.argv.includes('--force') })
console.log(
  r.skipped
    ? '이미 데이터가 있어 건너뛰었어요(--force로 다시)'
    : `시연 데이터 넣음 — 이번 주말 ${r.saturday}, 사람 ${r.users}명`,
)
await sql.end()
