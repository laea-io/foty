// 코스 저장 · 커뮤니티 글 · 답변 쓰기. DB를 인자로 받아 시험할 수 있게.
import { and, eq } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { notify } from '@/lib/server/domain/notify'
import { type AnyDb, FlowError } from '@/lib/server/domain/types'

/** 코스 저장 / 후기에서 가져오기 */
export async function saveCourse(
  db: AnyDb,
  input: {
    userId: string
    corePlaceId: string
    title: string
    stops: string[]
    day?: string | null
    fromPostId?: string
  },
) {
  if (input.fromPostId) {
    const [p] = await db.select().from(s.posts).where(eq(s.posts.id, input.fromPostId))
    if (!p?.allowCopy) throw new FlowError('no-copy', '이 후기는 코스 가져오기를 허용하지 않았어요')
  }
  const [row] = await db
    .insert(s.savedCourses)
    .values({
      userId: input.userId,
      corePlaceId: input.corePlaceId,
      title: input.title.slice(0, 40),
      stops: input.stops,
      day: input.day ?? null,
      fromPostId: input.fromPostId,
    })
    .returning()
  return row.id
}

/** 글 쓰기 — 여행 후기는 그 테마에서 체크인한 사람만(실제 방문 기반) */
export async function writePost(
  db: AnyDb,
  input: {
    userId: string
    kind: '여행 후기' | '코스 공유' | '질문'
    title: string
    body: string
    themeId?: string
    placeId?: string
    photos?: string[]
    transport?: string
    changedPlace?: string
    spentWon?: number | null
    public?: boolean
    allowCopy?: boolean
  },
) {
  const title = input.title.trim().slice(0, 60)
  const body = input.body.trim().slice(0, 2000)
  if (!title || !body) throw new FlowError('input', '제목과 내용을 적어 주세요')
  let placeId = input.placeId
  let visitedOn: string | null = null
  if (input.kind === '여행 후기') {
    if (!input.themeId) throw new FlowError('input', '다녀온 테마를 골라 주세요')
    const [c] = await db
      .select({ placeId: s.checkins.placeId, day: s.themes.day })
      .from(s.checkins)
      .innerJoin(s.themes, eq(s.themes.id, s.checkins.themeId))
      .where(and(eq(s.checkins.themeId, input.themeId), eq(s.checkins.userId, input.userId)))
    if (!c) throw new FlowError('no-visit', '체크인한 테마에만 후기를 남길 수 있어요')
    placeId = c.placeId
    visitedOn = c.day
  }
  const id = `p-${crypto.randomUUID().slice(0, 8)}`
  await db.insert(s.posts).values({
    id,
    kind: input.kind,
    authorId: input.userId,
    themeId: input.themeId ?? null,
    placeId: placeId ?? null,
    title,
    body,
    photos: (input.photos ?? []).slice(0, 6),
    transport: input.transport ?? null,
    changedPlace: input.changedPlace?.trim() || null,
    spentWon: input.spentWon ?? null,
    public: input.public ?? true,
    allowCopy: input.allowCopy ?? true,
    visitedOn,
  })
  return id
}

/** 질문에 답하기 */
export async function answer(db: AnyDb, input: { userId: string; postId: string; body: string }) {
  const body = input.body.trim().slice(0, 1000)
  if (!body) throw new FlowError('input', '답변을 적어 주세요')
  const [p] = await db.select().from(s.posts).where(eq(s.posts.id, input.postId))
  if (!p) throw new FlowError('not-found', '글을 찾을 수 없어요')
  await db.insert(s.comments).values({ postId: p.id, authorId: input.userId, body })
  if (p.authorId !== input.userId)
    await notify(db, [p.authorId], {
      title: '질문에 답변이 달렸어요',
      body: p.title,
      href: `/community/${p.id}`,
    })
}
