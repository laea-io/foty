// 운영팀 큐레이션 테마 — data/curated-themes.json(ops/themes/make.py가 실제 장소로 만든 것)을 넣는다.
// 호스트는 'foty 큐레이션'(운영팀이 직접 연 테마) 한 곳. 이미 있는 테마·마감이 지난 테마는 건너뛴다(지우지 않는다).
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { eq, inArray } from 'drizzle-orm'
import type { AnyDb } from '@/lib/server/domain/types'
import * as s from './schema'

export const CURATED_FILE = path.join(process.cwd(), 'data', 'curated-themes.json')
export const CURATION_HOST = 'foty'

type CuratedTheme = {
  id: string
  corePlaceId: string
  day: string
  start: string
  end: string
  min: number
  max: number
  origin: string
  travelMin: number
  transit: boolean
  costWon: number
  meet: string
  title: string
  intro: string
  include: string
  exclude: string
  activities: string[]
  stops: { placeId: string; time: string; stayMin: number; next: string | null; fixed: boolean }[]
}

async function ensureHost(db: AnyDb) {
  const [h] = await db.select().from(s.hosts).where(eq(s.hosts.id, CURATION_HOST))
  if (h) return
  let [u] = await db.select().from(s.users).where(eq(s.users.handle, 'foty-curation'))
  if (!u)
    [u] = await db
      .insert(s.users)
      .values({ handle: 'foty-curation', name: 'foty 큐레이션', onboarded: true })
      .returning()
  await db.insert(s.hosts).values({
    id: CURATION_HOST,
    userId: u.id,
    kind: 'business',
    name: 'foty 큐레이션',
    area: '남양주',
    intro:
      'foty 운영팀이 남양주의 실제 장소로 직접 짠 테마예요. 가게가 여는 테마가 아니라 식사·음료는 현장에서 각자 결제해요.',
    status: '확인 완료',
    confirmMode: 'auto',
    verifiedAt: new Date(),
  })
}

export async function syncCurated(db: AnyDb, file = CURATED_FILE, now = new Date()) {
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    return { added: 0 }
  }
  const list = (JSON.parse(raw) as { themes: CuratedTheme[] }).themes
  // 모집 마감(전날 18:00 KST)이 지난 테마는 넣지 않는다 — 넣자마자 자동 취소되므로
  const deadlineOf = (day: string) => {
    const d = new Date(`${day}T18:00:00+09:00`)
    d.setUTCDate(d.getUTCDate() - 1)
    return d
  }
  const live = list.filter((t) => deadlineOf(t.day) > now)
  if (!live.length) return { added: 0 }
  // 장소가 아직 없으면(장소 동기화 전) 건너뛴다
  const placeIds = [...new Set(live.flatMap((t) => t.stops.map((x) => x.placeId)))]
  const known = new Set(
    (await db.select({ id: s.places.id }).from(s.places).where(inArray(s.places.id, placeIds))).map(
      (p) => p.id,
    ),
  )
  const have = new Set(
    (
      await db
        .select({ id: s.themes.id })
        .from(s.themes)
        .where(
          inArray(
            s.themes.id,
            live.map((t) => t.id),
          ),
        )
    ).map((t) => t.id),
  )
  const todo = live.filter((t) => !have.has(t.id) && t.stops.every((x) => known.has(x.placeId)))
  if (!todo.length) return { added: 0 }
  await ensureHost(db)
  for (const t of todo) {
    await db.insert(s.themes).values({
      id: t.id,
      hostId: CURATION_HOST,
      corePlaceId: t.corePlaceId,
      title: t.title,
      intro: t.intro,
      day: t.day,
      start: t.start,
      end: t.end,
      min: t.min,
      max: t.max,
      deadline: deadlineOf(t.day),
      origin: t.origin,
      travelMin: t.travelMin,
      transit: t.transit,
      costWon: t.costWon,
      meet: t.meet,
      include: t.include,
      exclude: t.exclude,
      activities: t.activities,
      status: '모집 중',
      confirmMode: 'auto',
    })
    await db.insert(s.themeStops).values(
      t.stops.map((x, i) => ({
        themeId: t.id,
        ord: i + 1,
        placeId: x.placeId,
        time: x.time,
        stayMin: x.stayMin,
        next: x.next,
        fixed: x.fixed,
      })),
    )
  }
  return { added: todo.length }
}
