// 서버가 뜰 때 한 번: DB 마이그레이션 → (스테이징) 시연 데이터 → 실제 장소 → 상태 넘기기 타이머.
// 인스턴스가 하나라 시작 시 실행이 가장 단순하다. 끄려면 MIGRATE_ON_START=0 · JOBS=0.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { assertRuntimeEnv } = await import('@/lib/env')
  assertRuntimeEnv()
  if (process.env.MIGRATE_ON_START !== '0') {
    const { runMigrations } = await import('@/lib/db/migrate')
    await runMigrations()
    console.log('[foty] migrations up to date')
  }
  if (process.env.DEMO_MODE === '1') {
    const { db } = await import('@/lib/db')
    const { seedDemo } = await import('@/lib/db/seed-data')
    const r = await seedDemo(db)
    if (!r.skipped) console.log(`[foty] demo data seeded (weekend ${r.saturday})`)
  }
  // 실제 장소(관광공사 TourAPI · stay-sync에서 만든 data/places-namyangju.json) — 있으면 갱신, 없으면 넣기
  if (process.env.PLACES_SYNC !== '0') {
    const { db } = await import('@/lib/db')
    const { syncPlaces } = await import('@/lib/db/places-sync')
    const r = await syncPlaces(db)
    if (r.count) console.log(`[foty] places synced: ${r.count} (${r.fetchedOn})`)
  }
  if (process.env.JOBS !== '0') {
    const { startJobs } = await import('@/lib/server/jobs')
    startJobs()
  }
}
