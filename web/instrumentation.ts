// 서버가 뜰 때 한 번: DB 마이그레이션. 인스턴스가 하나라 시작 시 실행이 가장 단순하다.
// 끄려면 MIGRATE_ON_START=0 (그때는 `pnpm db:migrate`로 직접).
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.MIGRATE_ON_START === '0') return
  const { runMigrations } = await import('@/lib/db/migrate')
  await runMigrations()
  console.log('[foty] migrations up to date')
}
