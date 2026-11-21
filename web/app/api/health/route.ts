import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// gate 포트 점검·도커 healthcheck용. DB까지 닿는지 본다.
export async function GET() {
  try {
    await sql`select 1`
    return Response.json({ ok: true, db: 'up' })
  } catch {
    return Response.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
