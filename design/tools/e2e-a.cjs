// 그룹 A 끝까지 확인(실제 로그인 화면으로): node ../design/tools/e2e-a.cjs <base>
const { chromium } = require('playwright')
const postgres = require(require.resolve('postgres', { paths: [process.cwd()] }))
const [base] = process.argv.slice(2)
const sql = postgres(process.env.DATABASE_URL, { max: 1 })
const out = []
const ok = (n, c, d = '') => out.push(`${c ? 'PASS' : 'FAIL'} ${n}${d ? ` — ${d}` : ''}`)
const vis = (p, s) => p.locator(s).locator('visible=true').first()
;(async () => {
  const b = await chromium.launch()
  try {
    // 이메일 로그인 → next로 돌아가기
    let ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
    let p = await ctx.newPage()
    await p.goto(`${base}/trips`)
    await p.waitForURL(/\/login\?next=/, { timeout: 10000 })
    ok('protected page asks for login', true)
    await p.goto(`${base}/login/email?next=%2Fmy`)
    await vis(p, 'input[name="email"]').fill('kanghyun@demo.foty.kr')
    await vis(p, 'input[name="password"]').fill('wrong-password')
    await vis(p, 'button[type="submit"]').click()
    await p.waitForSelector('text=맞지 않아요', { timeout: 10000 })
    ok('wrong password refused', true)
    await vis(p, 'input[name="password"]').fill('foty-demo')
    await vis(p, 'button[type="submit"]').click()
    await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 }).catch(() => {})
    ok('email login lands on next', new URL(p.url()).pathname === '/my' && (await p.content()).includes('강현'), p.url())
    await ctx.close()
    // 가입 → 성향 → 홈
    ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
    p = await ctx.newPage()
    await p.goto(`${base}/signup/email`)
    const email = `e2e${Date.now()}@example.com`
    for (const [n, v] of [['name', '새 사람'], ['email', email], ['password', 'pass-1234'], ['password2', 'pass-1234']]) {
      const f = p.locator(`input[name="${n}"]`).locator('visible=true').first()
      if (await f.count()) await f.fill(v)
    }
    for (const c of await p.locator('input[type=checkbox]').locator('visible=true').all()) await c.check({ force: true }).catch(() => {})
    for (const sw of await p.locator('[role=switch][aria-checked=false]').locator('visible=true').all()) await sw.click().catch(() => {})
    await vis(p, 'button[type="submit"]').click()
    await p.waitForURL(/\/onboarding/, { timeout: 15000 })
    const [u] = await sql`select onboarded from users where email = ${email}`
    ok('signup creates user and goes to onboarding', !!u && u.onboarded === false)
    await ctx.close()
    // 시연 계정 버튼(운영팀) → /admin
    ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    p = await ctx.newPage()
    await p.goto(`${base}/login`)
    await vis(p, 'button:has-text("운영팀")').click()
    await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 })
    await p.goto(`${base}/admin`)
    ok('demo admin sees admin', (await p.content()).includes('호스트 확인'))
    await ctx.close()
  } catch (e) {
    out.push(`FAIL exception ${e.message.split('\n')[0]}`)
  } finally {
    await b.close()
    await sql.end()
    console.log(out.join('\n'))
  }
})()
