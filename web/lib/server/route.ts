import 'server-only'
// 실제 도로 경로 — 카카오모빌리티 길찾기(자동차 경로). KAKAO_REST_KEY로 부른다.
// 같은 장소 순서는 서버 메모리에 하루 동안 기억한다. 실패하면 null → 지도는 직선 점선으로 그린다.
import { env } from '@/lib/env'

export type LatLng = { lat: number; lng: number }
export type RoadRoute = {
  /** 지도에 그릴 점 [위도, 경도] */
  path: [number, number][]
  /** 구간별(장소 → 다음 장소) 거리(m)·시간(초) */
  legs: { distance: number; duration: number }[]
}

const cache = new Map<string, { at: number; v: RoadRoute | null }>()
const DAY = 24 * 3600 * 1000

type Section = { distance: number; duration: number; roads: { vertexes: number[] }[] }

export async function roadRoute(points: LatLng[]): Promise<RoadRoute | null> {
  if (!env.KAKAO_REST_KEY || points.length < 2 || points.length > 7) return null
  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';')
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < DAY) return hit.v
  const xy = (p: LatLng) => `${p.lng},${p.lat}`
  const q = new URLSearchParams({
    origin: xy(points[0]),
    destination: xy(points[points.length - 1]),
    priority: 'RECOMMEND',
  })
  if (points.length > 2) q.set('waypoints', points.slice(1, -1).map(xy).join('|'))
  let v: RoadRoute | null = null
  try {
    const res = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${q}`, {
      headers: { Authorization: `KakaoAK ${env.KAKAO_REST_KEY}` },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`kakao ${res.status}`)
    const data = (await res.json()) as { routes?: { result_code: number; sections?: Section[] }[] }
    const r = data.routes?.[0]
    if (!r || r.result_code !== 0 || !r.sections) throw new Error(`route ${r?.result_code}`)
    const path: [number, number][] = []
    for (const sec of r.sections)
      for (const road of sec.roads)
        for (let i = 0; i + 1 < road.vertexes.length; i += 2)
          path.push([road.vertexes[i + 1], road.vertexes[i]])
    v = { path, legs: r.sections.map((s) => ({ distance: s.distance, duration: s.duration })) }
  } catch (e) {
    console.warn('[foty] 길찾기 실패 — 직선으로 그림:', e instanceof Error ? e.message : e)
    return null // 실패는 기억하지 않는다
  }
  if (cache.size > 500) cache.delete(cache.keys().next().value as string)
  cache.set(key, { at: Date.now(), v })
  return v
}
