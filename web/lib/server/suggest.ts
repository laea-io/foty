// 코스 제안 — 검토된 장소 목록 안에서만 고른다(실시간 검색 아님 · 기획안 원칙 3·5).
// OPENAI_API_KEY가 있으면 AI(ai.ts)가 후보 안에서 고르고, 없거나 실패하면 규칙 기반:
// 같은 권역 · 덜 알려진 장소 먼저 · 식사/카페 1곳 이상. 어느 쪽이든 입출력은 같다.
import { and, eq, inArray, ne, or } from 'drizzle-orm'
import * as s from '@/lib/db/schema'
import { type AiCandidate, aiPick } from './ai'
import type { AnyDb } from './domain/types'

export type Place = typeof s.places.$inferSelect
export type Ask = '카페 한 곳 더' | '덜 걷는 코스로' | '실내 장소로' | '예산 줄이기' | '점심 먹을 곳' | string

const EAT = ['맛집']
const CAFE = ['카페']

/** 핵심 장소와 같은 권역의 검토된 장소(핵심·집결 제외) */
async function nearby(db: AnyDb, core: Place) {
  // 같은 권역이거나 같은 읍·면(걸어서·버스로 닿는 거리)
  const sameArea = core.region
    ? or(eq(s.places.region, core.region), eq(s.places.area, core.area))
    : eq(s.places.area, core.area)
  const rows = await db
    .select()
    .from(s.places)
    .where(and(ne(s.places.id, core.id), sameArea, ne(s.places.group, '기타')))
  // 스탬프 칸이 아닌(덜 알려진) 장소를 먼저
  return rows.sort((a, b) => Number(a.stamp) - Number(b.stamp) || a.name.localeCompare(b.name, 'ko'))
}

const toCand = (p: Place): AiCandidate => ({
  id: p.id,
  name: p.name,
  kind: p.kind,
  group: p.group,
  area: p.area,
  indoor: p.indoor,
  cost: p.cost,
  checked: !!p.checkedOn,
})
const MAX_CANDIDATES = 24

/** AI 도우미·코스 바꾸기 요청 → 대안 장소(최대 n). label·reason은 AI가 골랐을 때만 */
export async function suggestPlaces(
  db: AnyDb,
  input: { corePlaceId: string; ask: Ask; exclude?: string[]; n?: number },
) {
  const [core] = await db.select().from(s.places).where(eq(s.places.id, input.corePlaceId))
  if (!core) return { places: [] as Place[], understood: false }
  let list = (await nearby(db, core)).filter((p) => !input.exclude?.includes(p.id))
  const ask = input.ask
  const ai = await aiPick({
    ask,
    core,
    candidates: list.slice(0, MAX_CANDIDATES).map(toCand),
    n: input.n ?? 2,
    purpose: 'swap',
  })
  if (ai) {
    const places = ai.ids.map((id) => list.find((p) => p.id === id)).filter((p): p is Place => !!p)
    return { places, understood: places.length > 0, label: ai.label, reason: ai.reason }
  }
  let understood = true
  if (ask.includes('카페') || ask.includes('차')) list = list.filter((p) => CAFE.includes(p.group))
  else if (ask.includes('점심') || ask.includes('밥') || ask.includes('식사'))
    list = list.filter((p) => EAT.includes(p.group))
  else if (ask.includes('실내')) list = list.filter((p) => p.indoor)
  else if (ask.includes('예산') || ask.includes('싸'))
    list = [...list].sort((a, b) => a.cost - b.cost).filter((p) => p.cost <= 10000)
  else if (ask.includes('덜 걷') || ask.includes('걷'))
    list = list.filter((p) => p.indoor || p.group !== '자연')
  else understood = false
  return { places: list.slice(0, input.n ?? 2), understood, label: undefined, reason: undefined }
}

/** 핵심 장소 하나로 하루 코스 초안: 앞 1곳 + 핵심 + 뒤 1~2곳(식사나 카페 포함) */
export async function draftCourse(db: AnyDb, input: { corePlaceId: string; start: string; ask?: Ask }) {
  const [core] = await db.select().from(s.places).where(eq(s.places.id, input.corePlaceId))
  if (!core) return []
  const near = await nearby(db, core)
  const ask = input.ask ?? ''
  // 요청 조건(실내 · 예산)에 맞는 곳을 먼저, 없으면 조건 없이
  const ok = (p: Place) =>
    (ask.includes('실내') ? p.indoor : true) && (ask.includes('예산') ? p.cost <= 10000 : true)
  const pick = (pred: (p: Place) => boolean, used: Set<string>) =>
    near.find((p) => !used.has(p.id) && pred(p) && ok(p)) ?? near.find((p) => !used.has(p.id) && pred(p))
  const used = new Set<string>()
  const coreIsEat = EAT.includes(core.group)
  const before = pick((p) => p.group === '문화 공간' || p.group === '자연', used)
  if (before) used.add(before.id)
  const after1 = pick(
    (p) => (coreIsEat ? p.group === '자연' || p.group === '문화 공간' : EAT.includes(p.group)),
    used,
  )
  if (after1) used.add(after1.id)
  const after2 = pick((p) => CAFE.includes(p.group), used)
  if (after2) used.add(after2.id)
  const extraCafe = ask.includes('카페') ? pick((p) => CAFE.includes(p.group), used) : undefined
  const walkLess = ask.includes('덜 걷')
  let seq = [walkLess ? undefined : before, core, after1, after2, extraCafe].filter((p): p is Place => !!p)
  // 요청이 있으면 AI가 후보 안에서 다시 고른다 — 자연·문화 공간 1곳은 앞, 식사 → 카페는 뒤
  const ai = ask
    ? await aiPick({
        ask,
        core,
        candidates: near.slice(0, MAX_CANDIDATES).map(toCand),
        n: 3,
        purpose: 'draft',
      })
    : null
  if (ai?.ids.length) {
    const picked = ai.ids.map((id) => near.find((p) => p.id === id)).filter((p): p is Place => !!p)
    const lead = picked.find((p) => p.group === '자연' || p.group === '문화 공간')
    const rank = (p: Place) => (EAT.includes(p.group) ? 0 : CAFE.includes(p.group) ? 2 : 1)
    const tail = picked.filter((p) => p !== lead).sort((a, b) => rank(a) - rank(b))
    seq = [lead, core, ...tail].filter((p): p is Place => !!p)
  }
  // 시간: 핵심 장소를 start에 맞추고 앞뒤를 붙인다
  const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3))
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const stay = (p: Place) =>
    p.id === core.id ? 80 : EAT.includes(p.group) ? 70 : CAFE.includes(p.group) ? 50 : 50
  const coreIdx = seq.findIndex((p) => p.id === core.id)
  const times: number[] = []
  times[coreIdx] = toMin(input.start)
  for (let i = coreIdx - 1; i >= 0; i--) times[i] = times[i + 1] - stay(seq[i]) - 20
  for (let i = coreIdx + 1; i < seq.length; i++) times[i] = times[i - 1] + stay(seq[i - 1]) + 20
  return seq.map((p, i) => ({
    placeId: p.id,
    time: fmt(times[i]),
    stayMin: stay(p),
    next: i < seq.length - 1 ? (i % 2 ? '버스 12분' : '도보 8분') : null,
    fixed: p.id === core.id,
    place: p,
  }))
}

export async function placesByIds(db: AnyDb, ids: string[]) {
  if (!ids.length) return []
  return db.select().from(s.places).where(inArray(s.places.id, ids))
}
