import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { eq, sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { PLACES_FILE, type SourcePlace, syncPlaces } from '@/lib/db/places-sync'
import * as s from '@/lib/db/schema'
import { draftCourse } from '@/lib/server/suggest'
import { testDb } from './db'

let t: Awaited<ReturnType<typeof testDb>>
beforeEach(async () => {
  t = await testDb()
})

const place = (o: Partial<SourcePlace>): SourcePlace => ({
  id: 'tour-1',
  sourceId: '1',
  contentType: '12',
  name: '시험 정원',
  area: '조안면',
  kind: '정원',
  group: '자연',
  region: 'paldang',
  indoor: false,
  cost: 0,
  address: '경기도 남양주시 조안면',
  lat: 37.5,
  lng: 127.3,
  phone: null,
  hours: '상시 개방',
  closed: null,
  parking: '가능',
  menu: null,
  overview: '소개',
  homepage: null,
  image: 'https://tong.visitkorea.or.kr/a.jpg',
  images: ['https://tong.visitkorea.or.kr/a.jpg', 'https://tong.visitkorea.or.kr/b.jpg'],
  imageCredit: 'Type3',
  sourceModified: '2026-11-11',
  ...o,
})

const file = (places: SourcePlace[]) => {
  const f = path.join(mkdtempSync(path.join(tmpdir(), 'foty-')), 'p.json')
  writeFileSync(f, JSON.stringify({ fetchedOn: '2026-11-22', places }))
  return f
}

describe('real places (TourAPI file)', () => {
  it('inserts, then updates source fields but keeps the ops team stamp choice', async () => {
    const r = await syncPlaces(
      t.db,
      file([
        place({}),
        place({ id: 'tour-2', sourceId: '2', contentType: '39', group: '맛집', name: '시험 식당' }),
      ]),
    )
    expect(r.count).toBe(2)
    const [p1] = await t.db.select().from(s.places).where(eq(s.places.id, 'tour-1'))
    expect(p1.stamp).toBe(true) // 관광지 = 스탬프 칸
    expect(p1.images).toHaveLength(2)
    expect(p1.checkedOn).toBe('2026-11-11')
    const [p2] = await t.db.select().from(s.places).where(eq(s.places.id, 'tour-2'))
    expect(p2.stamp).toBe(false) // 식당은 아님
    await t.db.update(s.places).set({ stamp: false }).where(eq(s.places.id, 'tour-1'))
    await syncPlaces(t.db, file([place({ name: '시험 정원(새 이름)', hours: '09:00~18:00' })]))
    const [again] = await t.db.select().from(s.places).where(eq(s.places.id, 'tour-1'))
    expect(again.name).toBe('시험 정원(새 이름)')
    expect(again.hours).toBe('09:00~18:00')
    expect(again.stamp).toBe(false)
  })

  it('missing file is not an error', async () => {
    expect((await syncPlaces(t.db, '/nope/places.json')).count).toBe(0)
  })

  it('the committed file loads and real places make a course', async () => {
    const r = await syncPlaces(t.db, PLACES_FILE)
    expect(r.count).toBeGreaterThan(200)
    const [{ n }] = await t.db
      .execute<{ n: number }>(sql`select count(*)::int n from places where source = 'tourapi'`)
      .then((x) => (Array.isArray(x) ? x : (x as { rows: { n: number }[] }).rows))
    expect(n).toBe(r.count)
    const [core] = await t.db.select().from(s.places).where(eq(s.places.name, '수종사'))
    expect(core).toBeTruthy()
    const d = await draftCourse(t.db, { corePlaceId: core.id, start: '11:00' })
    expect(d.find((x) => x.fixed)?.placeId).toBe(core.id)
    expect(d.length).toBeGreaterThanOrEqual(3)
    // 시험 DB에는 시안 장소(로컬 사진)도 있으니 관광공사 장소만 본다
    const tour = await t.db.select().from(s.places).where(eq(s.places.source, 'tourapi'))
    expect(tour.every((p) => p.image.startsWith('https://') && p.images.length > 0)).toBe(true)
  })
})

describe('curated themes (data/curated-themes.json)', () => {
  it('loads live themes once, hosted by foty 큐레이션, with real stops', async () => {
    const { syncCurated, CURATED_FILE } = await import('@/lib/db/curated-sync')
    await syncPlaces(t.db, PLACES_FILE)
    // 파일의 첫 날짜보다 사흘 전으로 시계를 맞춘다
    const now = new Date('2026-11-25T00:00:00+09:00')
    const r = await syncCurated(t.db, CURATED_FILE, now)
    expect(r.added).toBe(50)
    expect((await syncCurated(t.db, CURATED_FILE, now)).added).toBe(0)
    const [h] = await t.db.select().from(s.hosts).where(eq(s.hosts.id, 'foty'))
    expect(h.name).toBe('foty 큐레이션')
    expect(h.status).toBe('확인 완료')
    const stops = await t.db.select().from(s.themeStops)
    const tourStops = stops.filter((x) => x.placeId.startsWith('tour-'))
    expect(tourStops.length).toBeGreaterThanOrEqual(150)
    // 마감이 지난 날짜는 넣지 않는다
    const late = await testDb()
    await syncPlaces(late.db, PLACES_FILE)
    expect((await syncCurated(late.db, CURATED_FILE, new Date('2026-12-30T00:00:00+09:00'))).added).toBe(0)
  })
})
