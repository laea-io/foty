// 통합 검색 — 테마·장소·호스트·게시글.
import 'server-only'
import { and, eq, gte, inArray, or, sql } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import type { AnyDb } from '@/lib/server/domain/types'
import { loadThemes, type ThemeView } from '@/lib/server/queries/theme-view'
import { LISTED } from '@/lib/server/queries/themes'
import { today } from '@/lib/server/util/time'

// ── 검색 ─────────────────────────────────────────────
export const like = (k: string) => `%${k.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

/** 테마(제목·핵심 장소, 목록 상태, 오늘 이후) · 코스 장소(이름) · 공개 글(제목·본문) */
export async function searchAll(db: AnyDb, q: string, opts: { prefs?: string[]; now?: Date } = {}) {
  const k = q.replace(/\s+/g, '').toLowerCase()
  const t = today(opts.now)
  const norm = (col: unknown) => sql`replace(lower(${col}), ' ', '')`
  const listed = and(inArray(s.themes.status, [...LISTED]), gte(s.themes.day, t))
  let themeIds: string[] | undefined
  if (k) {
    const rows = await db
      .select({ id: s.themes.id })
      .from(s.themes)
      .innerJoin(s.places, eq(s.places.id, s.themes.corePlaceId))
      .where(
        and(
          listed,
          or(sql`${norm(s.themes.title)} like ${like(k)}`, sql`${norm(s.places.name)} like ${like(k)}`),
        ),
      )
    themeIds = rows.map((r) => r.id)
  }
  const themes: ThemeView[] =
    themeIds && !themeIds.length
      ? []
      : await loadThemes(db, { where: themeIds ? inArray(s.themes.id, themeIds) : listed, prefs: opts.prefs })
  const [places] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.places)
    .where(
      k
        ? or(
            sql`${norm(s.places.name)} like ${like(k)}`,
            sql`${norm(sql`coalesce(${s.places.short}, '')`)} like ${like(k)}`,
          )
        : undefined,
    )
  const [posts] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.posts)
    .where(
      and(
        eq(s.posts.public, true),
        k
          ? or(sql`${norm(s.posts.title)} like ${like(k)}`, sql`${norm(s.posts.body)} like ${like(k)}`)
          : undefined,
      ),
    )
  return { themes, courses: Number(places?.n ?? 0), reviews: Number(posts?.n ?? 0) }
}
