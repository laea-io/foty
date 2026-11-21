import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// 첫 테이블은 자리 표시 — 서비스가 정해지면 바꾼다.
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
