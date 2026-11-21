import * as s from '@/lib/db/schema'
import type { AnyDb } from './types'

/** 알림 넣기(같은 사람에게 여러 번 넣지 않게 중복 제거) */
export async function notify(
  db: AnyDb,
  userIds: (string | null | undefined)[],
  n: { title: string; body?: string; href: string },
) {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))]
  if (!ids.length) return
  await db
    .insert(s.notifications)
    .values(ids.map((userId) => ({ userId, title: n.title, body: n.body ?? '', href: n.href })))
}

/** 그룹 대화에 시스템 안내 한 줄 */
export async function systemMessage(db: AnyDb, themeId: string, body: string) {
  await db.insert(s.messages).values({ themeId, userId: null, body })
}
