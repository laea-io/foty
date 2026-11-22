// 실제 장소 넣기 — data/places-namyangju.json(ops/places/fetch.py가 관광공사 TourAPI · stay-sync에서 만든 것)을
// places 표에 반영한다. 서버가 뜰 때마다 돈다(260곳, 1초 안). id가 같으면 원본 정보만 갱신하고,
// 운영팀이 정하는 값(스탬프 여부)은 처음 넣을 때만 정한다. 장소를 지우지는 않는다(테마가 가리킬 수 있다).
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { sql } from 'drizzle-orm'
import type { AnyDb } from '@/lib/server/domain/types'
import * as s from './schema'

export type SourcePlace = {
  id: string
  sourceId: string
  contentType: string
  name: string
  area: string
  kind: string
  group: string
  region: string | null
  indoor: boolean
  cost: number
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  hours: string | null
  closed: string | null
  parking: string | null
  menu: string | null
  overview: string | null
  homepage: string | null
  image: string
  images: string[]
  imageCredit: string
  sourceModified: string | null
}

export const PLACES_FILE = path.join(process.cwd(), 'data', 'places-namyangju.json')

export function toRow(p: SourcePlace): typeof s.places.$inferInsert {
  return {
    id: p.id,
    name: p.name,
    area: p.area,
    kind: p.kind,
    group: p.group,
    region: p.region,
    // 관광공사가 정보를 마지막으로 고친 날 — 이 날짜가 없으면 "재확인 필요"
    checkedOn: p.sourceModified,
    sourceUrl: p.homepage,
    image: p.image,
    imageAlt: p.name,
    indoor: p.indoor,
    cost: p.cost,
    // 관광지·문화시설을 스탬프 칸으로(식당·카페·레포츠는 아님) — 처음 넣을 때만
    stamp: p.contentType === '12' || p.contentType === '14',
    source: 'tourapi',
    sourceId: p.sourceId,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    phone: p.phone,
    hours: p.hours,
    closed: p.closed,
    parking: p.parking,
    menu: p.menu,
    overview: p.overview,
    images: p.images,
    imageCredit: p.imageCredit,
  }
}

const UPDATE = [
  ['name', 'name'],
  ['area', 'area'],
  ['kind', 'kind'],
  ['group', 'group'],
  ['region', 'region'],
  ['checkedOn', 'checked_on'],
  ['sourceUrl', 'source_url'],
  ['image', 'image'],
  ['imageAlt', 'image_alt'],
  ['indoor', 'indoor'],
  ['cost', 'cost'],
  ['source', 'source'],
  ['sourceId', 'source_id'],
  ['address', 'address'],
  ['lat', 'lat'],
  ['lng', 'lng'],
  ['phone', 'phone'],
  ['hours', 'hours'],
  ['closed', 'closed'],
  ['parking', 'parking'],
  ['menu', 'menu'],
  ['overview', 'overview'],
  ['images', 'images'],
  ['imageCredit', 'image_credit'],
] as const

export async function syncPlaces(db: AnyDb, file = PLACES_FILE) {
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    return { count: 0, fetchedOn: null }
  }
  const data = JSON.parse(raw) as { fetchedOn: string; places: SourcePlace[] }
  const rows = data.places.map(toRow)
  const set = Object.fromEntries(UPDATE.map(([key, col]) => [key, sql.raw(`excluded."${col}"`)]))
  for (let i = 0; i < rows.length; i += 100) {
    await db
      .insert(s.places)
      .values(rows.slice(i, i + 100))
      .onConflictDoUpdate({ target: s.places.id, set })
  }
  return { count: rows.length, fetchedOn: data.fetchedOn }
}
