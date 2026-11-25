// 커뮤니티 읽기 — 게시글 목록·상세(차단·숨김 반영), 후기를 쓸 수 있는 테마.
import 'server-only'
import { and, asc, count, desc, eq, gte, isNull, notInArray, or, sql } from 'drizzle-orm'
import { db, schema as s } from '@/lib/db'
import { getViewer } from '@/lib/server/auth/session'
import { loadThemes } from '@/lib/server/queries/theme-view'
import { ago, parts, today, won } from '@/lib/server/util/time'
import type { Img } from '@/lib/shared/theme'

// ── 커뮤니티 ─────────────────────────────────────────
export type PostView = {
  id: string
  kind: '여행 후기' | '코스 공유' | '질문'
  author: string
  authorHandle: string
  trips: number
  when: string
  title: string
  summary: string
  body: string
  photos: Img[]
  stamp?: string
  facts?: string[]
  themeId?: string
  coursePlace?: string
  /** 코스 가져오기에 쓰는 장소 id 순서 */
  courseStops: string[]
  answers: { author: string; body: string; when: string }[]
}

const photoImg = (src: string): Img => ({ src, alt: '후기 사진', bg: '#e6e1d8' })

/** 내가 차단한 사람 id — 그 사람의 글·답변·대화는 내 화면에서 빠진다 */
export async function blockedBy(viewerId?: string | null) {
  if (!viewerId) return []
  const rows = await db.select({ id: s.blocks.blockedId }).from(s.blocks).where(eq(s.blocks.userId, viewerId))
  return rows.map((r) => r.id)
}

const POSTS_PAGE = 20

/** 커뮤니티 글(최신 순). limit까지 + 더 있는지 */
export async function posts(
  kind?: string,
  q?: string,
  limit = POSTS_PAGE,
): Promise<PostView[] & { more?: boolean }> {
  const blocked = await blockedBy((await getViewer())?.id)
  const k = (q ?? '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/[\\%_]/g, (c) => `\\${c}`)
  const norm = (col: unknown) => sql`replace(lower(${col}), ' ', '')`
  const conds = [
    eq(s.posts.public, true),
    isNull(s.posts.hiddenAt),
    blocked.length ? notInArray(s.posts.authorId, blocked) : undefined,
    kind ? sql`${s.posts.kind} = ${kind}` : undefined,
    k
      ? or(sql`${norm(s.posts.title)} like ${`%${k}%`}`, sql`${norm(s.posts.body)} like ${`%${k}%`}`)
      : undefined,
  ].filter(Boolean)
  const rows = await db
    .select({ p: s.posts, u: s.users })
    .from(s.posts)
    .innerJoin(s.users, eq(s.users.id, s.posts.authorId))
    .where(and(...conds))
    .orderBy(desc(s.posts.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200) + 1)
  const more = rows.length > limit
  const list: PostView[] & { more?: boolean } = await Promise.all(
    rows.slice(0, limit).map((r) => toPost(r.p, r.u, false)),
  )
  list.more = more
  return list
}

export async function post(id: string) {
  const [r] = await db
    .select({ p: s.posts, u: s.users })
    .from(s.posts)
    .innerJoin(s.users, eq(s.users.id, s.posts.authorId))
    .where(eq(s.posts.id, id))
  if (!r || r.p.hiddenAt) return null
  const viewer = await getViewer()
  if (!r.p.public && viewer?.id !== r.p.authorId) return null
  const blocked = await blockedBy(viewer?.id)
  if (blocked.includes(r.p.authorId)) return null
  return toPost(r.p, r.u, true, blocked)
}

async function toPost(
  p: typeof s.posts.$inferSelect,
  u: typeof s.users.$inferSelect,
  full: boolean,
  blocked: string[] = [],
): Promise<PostView> {
  const [trips] = await db
    .select({ n: count() })
    .from(s.attendance)
    .where(and(eq(s.attendance.userId, u.id), eq(s.attendance.status, '참여 확인')))
  // 실제 방문 기반 후기: 그 테마에서 체크인했으면 스탬프 표시
  let stamp: string | undefined
  if (p.themeId) {
    const [c] = await db
      .select({ name: s.places.name })
      .from(s.checkins)
      .innerJoin(s.places, eq(s.places.id, s.checkins.placeId))
      .where(and(eq(s.checkins.themeId, p.themeId), eq(s.checkins.userId, u.id)))
    stamp = c?.name
  }
  const [t] = p.themeId ? await db.select().from(s.themes).where(eq(s.themes.id, p.themeId)) : []
  const facts = [
    p.transport,
    t
      ? `${(await db.select({ n: count() }).from(s.themeStops).where(eq(s.themeStops.themeId, t.id)))[0].n}곳`
      : null,
    p.spentWon ? `실제 지출 ${won(p.spentWon)}` : null,
  ].filter((x): x is string => !!x)
  const answers = full
    ? (
        await db
          .select({ c: s.comments, name: s.users.name })
          .from(s.comments)
          .innerJoin(s.users, eq(s.users.id, s.comments.authorId))
          .where(
            and(
              eq(s.comments.postId, p.id),
              isNull(s.comments.hiddenAt),
              blocked.length ? notInArray(s.comments.authorId, blocked) : undefined,
            ),
          )
          .orderBy(asc(s.comments.createdAt))
      ).map((a) => ({ author: a.name, body: a.c.body, when: ago(a.c.createdAt) }))
    : []
  // 다음 날짜를 보여 줄 테마: 같은 핵심 장소의 모집 중 테마
  let nextTheme: string | undefined
  if (t) {
    const [n] = await db
      .select({ id: s.themes.id })
      .from(s.themes)
      .where(
        and(
          eq(s.themes.corePlaceId, t.corePlaceId),
          eq(s.themes.status, '모집 중'),
          gte(s.themes.day, today()),
        ),
      )
      .orderBy(asc(s.themes.day))
      .limit(1)
    nextTheme = n?.id
  }
  return {
    id: p.id,
    kind: p.kind,
    author: u.name,
    authorHandle: u.handle,
    trips: Number(trips?.n ?? 0),
    when:
      p.kind === '질문'
        ? ago(p.createdAt)
        : p.visitedOn
          ? `${parts(p.visitedOn).m}월 ${parts(p.visitedOn).d}일 방문`
          : ago(p.createdAt),
    title: p.title,
    summary: p.body.length > 70 ? `${p.body.slice(0, 68)}…` : p.body,
    body: p.body,
    photos: p.photos.map(photoImg),
    stamp,
    facts: facts.length ? facts : undefined,
    themeId: nextTheme,
    coursePlace: p.allowCopy ? (t?.corePlaceId ?? p.placeId ?? undefined) : undefined,
    courseStops: t
      ? (
          await db
            .select({ id: s.themeStops.placeId })
            .from(s.themeStops)
            .where(eq(s.themeStops.themeId, t.id))
            .orderBy(asc(s.themeStops.ord))
        ).map((x) => x.id)
      : p.placeId
        ? [p.placeId]
        : [],
    answers,
  }
}

/** 이번 주말 열린 테마(커뮤니티 옆) */
export async function openThemes(n = 3) {
  const viewer = await getViewer()
  const list = await loadThemes(db, {
    where: and(eq(s.themes.status, '모집 중'), gte(s.themes.day, today())),
    prefs: viewer?.prefs.activities,
  })
  return list.slice(0, n)
}

/** 후기 쓸 수 있는 내 테마(완료 + 체크인) */
export async function reviewableTheme(userId: string, themeId?: string) {
  const rows = await db
    .select({ id: s.checkins.themeId })
    .from(s.checkins)
    .innerJoin(s.themes, eq(s.themes.id, s.checkins.themeId))
    .where(and(eq(s.checkins.userId, userId), themeId ? eq(s.checkins.themeId, themeId) : undefined))
    .orderBy(desc(s.themes.day))
    .limit(1)
  if (!rows[0]) return null
  return (await loadThemes(db, { ids: [rows[0].id] }))[0] ?? null
}
