import { NextResponse } from 'next/server'
import { roadRoute } from '@/lib/server/services/directions'

/** GET /api/route?p=37.56,127.30;37.57,127.32 — 장소 순서대로 실제 도로 경로(로그인 필요: proxy) */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('p') ?? ''
  const points = raw
    .split(';')
    .slice(0, 7)
    .map((x) => x.split(',').map(Number))
    .filter(
      ([lat, lng]) =>
        Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180,
    )
    .map(([lat, lng]) => ({ lat, lng }))
  const r = points.length >= 2 ? await roadRoute(points) : null
  return NextResponse.json(r ?? { path: null }, {
    headers: { 'Cache-Control': 'private, max-age=86400' },
  })
}
