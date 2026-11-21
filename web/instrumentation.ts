// 서버가 뜰 때 한 번: DB 마이그레이션 → (스테이징) 시연 데이터 → 상태 넘기기 타이머.
// 인스턴스가 하나라 시작 시 실행이 가장 단순하다. 끄려면 MIGRATE_ON_START=0 · JOBS=0.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
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
  if (process.env.JOBS !== '0') {
    const { startJobs } = await import('@/lib/server/jobs')
    startJobs()
  }
}
