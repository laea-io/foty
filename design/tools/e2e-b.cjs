// 그룹 B 화면 걷기(로컬 확인용, 커밋하지 않음): node ../design/walk-b.cjs <base> <outDir>
// 로그인 화면은 A 담당이라 아직 연결 전 → 세션 행을 DB에 직접 넣고 쿠키를 심는다.
const path = require('node:path')
const crypto = require('node:crypto')
const fs = require('node:fs')
const req = (m) => require(require.resolve(m, { paths: [process.cwd(), __dirname] }))
let chromium
try {
  ;({ chromium } = req('playwright'))
} catch {
  ;({ chromium } = require('playwright'))
}
const postgres = req('postgres')

const [base, out] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const sql = postgres(process.env.DATABASE_URL, { max: 2 })
const SECRET = process.env.AUTH_SECRET || 'dev-only-secret-change-me-0123456789abcdef'
const results = []
const errors = []
const ok = (name, cond, extra = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`)
}

async function session(handle) {
  const tok = crypto.randomBytes(32).toString('base64url')
  const id = crypto.createHash('sha256').update(tok).digest('hex')
  await sql`insert into sessions (id, user_id, expires_at)
            select ${id}, id, now() + interval '1 day' from users where handle = ${handle}`
  return tok
}

const browserP = chromium.launch()
async function ctxFor(handle, mode = 'm') {
  const browser = await browserP
  const ctx = await browser.newContext({
    viewport: mode === 'm' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  if (handle) {
    const tok = await session(handle)
    const u = new URL(base)
    await ctx.addCookies([{ name: 'foty_session', value: tok, domain: u.hostname, path: '/' }])
  }
  return ctx
}
async function open(ctx, p) {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`${p} pageerror ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${p} console ${m.text()}`))
  const res = await page.goto(base + p, { waitUntil: 'load' })
  // 첫 화면(loading.tsx 뼈대)이 실제 화면으로 바뀔 때까지
  await page
    .waitForFunction(() => !document.body.innerText.includes('테마를 찾고 있어요'), null, { timeout: 10000 })
    .catch(() => {})
  return { page, status: res?.status() }
}
async function shot(page, name) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true })
}
const text = (page) => page.evaluate(() => document.body.innerText)

;(async () => {
  try {
    // ── 화면 캡처(모바일 · 데스크톱) ──
    for (const mode of ['m', 'd']) {
      const ctx = await ctxFor('kanghyun', mode)
      for (const p of [
        '/',
        '/?view=all',
        '/filter?view=all',
        '/themes/bongseonsa-temple',
        '/themes/sujongsa-tea',
        '/themes/byeollae-drip',
        '/themes/dasan-lunch-1114',
        '/themes/dasan-lunch',
        '/trips',
        '/trips/upcoming',
        '/trips/past',
        '/trips/gwangneung-morning',
        '/trips/gwangneung-morning/chat',
        '/trips/gwangneung-morning/members',
        '/trips/gwangneung-morning/history',
        '/trips/gwangneung-morning/checkin',
        '/trips/gwangneung-morning/ai?ask=실내 장소로',
        '/trips/dasan-lunch-1114/review',
        '/request',
      ]) {
        const { page, status } = await open(ctx, p)
        ok(`render ${p}@${mode}`, status === 200, String(status))
        await shot(page, `${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}@${mode}`)
        await page.close()
      }
      await ctx.close()
      const guest = await ctxFor(null, mode)
      const g = await open(guest, '/themes/bongseonsa-temple')
      ok(`guest detail@${mode}`, (await text(g.page)).includes('가입하고 신청하기'))
      await shot(g.page, `guest_detail@${mode}`)
      const g2 = await open(guest, '/trips')
      await g2.page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
      ok(`guest /trips → login@${mode}`, g2.page.url().includes('/login'), g2.page.url())
      await guest.close()
    }

    const me = await ctxFor('kanghyun', 'm')

    // ── 신청(자동 수락 · 이번 신청으로 성사) ──
    {
      const { page } = await open(me, '/themes/bongseonsa-temple')
      await page.getByRole('link', { name: '참여 신청' }).first().click()
      await page.waitForURL(/\/apply/)
      const sheet = page.locator('[role=dialog]').first()
      await sheet.locator('input[type=checkbox]').check()
      await sheet.getByRole('button', { name: '신청 보내기' }).click()
      await page.waitForURL(/\/(applied|matched)$/, { timeout: 15000 })
      ok('apply → matched', page.url().endsWith('/matched'), page.url())
      await shot(page, 'flow_matched@m')
      const trips = await open(me, '/trips/upcoming')
      ok('trips/upcoming lists the new trip', (await text(trips.page)).includes('봉선사 연등길'))
    }

    // ── 주요 변경 확인: 강현 → 도현 → 반영 ──
    {
      const { page } = await open(me, '/trips/gwangneung-morning')
      const before = (await text(page)).match(/(\d) \/ (\d)명 확인/)?.[0]
      await page.locator('form:has(input[name=changeId]) button[type=submit]').first().click()
      await page.waitForFunction(() => document.body.innerText.includes('4 / 5명 확인'), null, { timeout: 10000 })
      ok('confirm change moves count', true, `${before} → 4 / 5명 확인`)
      const dohyun = await ctxFor('dohyun', 'm')
      const d = await open(dohyun, '/trips/gwangneung-morning')
      await d.page.locator('form:has(input[name=changeId]) button[type=submit]').first().click()
      await d.page
        .waitForFunction(() => !document.body.innerText.includes('변경 확인 중'), null, { timeout: 10000 })
        .catch(() => {})
      const after = await open(dohyun, '/trips/gwangneung-morning/history')
      const ht = await text(after.page)
      ok('all confirmed → applied (반영됨) in history', /반영됨[\s\S]*집결 시간/.test(ht) && !ht.includes('변경 확인 중'))
      const sp = await open(me, '/themes/gwangneung-morning/matched')
      const has = await sp.page.waitForFunction(() => document.body.innerText.includes('08:20 · 상봉역'), null, { timeout: 8000 }).then(() => true, () => false)
      ok('meet time now 08:20', has, (await text(sp.page)).match(/\d\d:\d\d · [^\n]*/)?.[0])
      await shot(sp.page, 'gwangneung_matched_after@m')
      await dohyun.close()
    }

    // ── 대화 실시간(SSE): 강현이 보내면 유나 화면에 뜬다 ──
    {
      const yuna = await ctxFor('yuna', 'd')
      const y = await open(yuna, '/trips/gwangneung-morning/chat')
      await y.page.waitForTimeout(1500)
      const { page } = await open(me, '/trips/gwangneung-morning/chat')
      const msg = `실시간 확인 ${Date.now() % 100000}`
      await page.locator('#chat-m').fill(msg)
      const t0 = Date.now()
      await page.locator('#chat-m').press('Enter')
      await page.getByText(msg).first().waitFor({ timeout: 10000 })
      let got = false
      try {
        await y.page.waitForFunction((m) => document.body.innerText.includes(m), msg, { timeout: 10000 })
        got = true
      } catch {}
      ok('chat send appears for sender', true)
      ok('chat arrives live in second browser (SSE)', got, `${Date.now() - t0}ms`)
      await shot(y.page, 'chat_live_receiver@d')
      const minjae = await ctxFor('minjae', 'm')
      const mj = await open(minjae, '/trips/gwangneung-morning/chat')
      await mj.page.waitForFunction(() => document.body.innerText.includes('찾을 수 없어요'), null, { timeout: 8000 }).catch(() => {})
      const mt = await text(mj.page)
      ok('non-member chat → not found', mt.includes('찾을 수 없어요') && !mt.includes('이번 주 날씨'), `${mj.status} ${mt.slice(0, 60).replace(/\n/g, ' ')}`)
      const r = await minjae.request.get(`${base}/api/trips/gwangneung-morning/stream?once=1`)
      ok('non-member stream → 403', r.status() === 403, String(r.status()))
      await minjae.close()
      await yuna.close()
    }

    // ── AI 대안 → 코스에 제안 → 변경 이력 ──
    {
      const { page } = await open(me, '/trips/gwangneung-morning/ai?ask=' + encodeURIComponent('실내 장소로'))
      const sheet = page.locator('[role=dialog]')
      const name = await sheet.locator('.font-semibold.tracking-\\[-0\\.02em\\]').last().innerText()
      await sheet.getByRole('button', { name: '코스에 제안' }).last().click()
      await page.waitForURL(/\/trips\/gwangneung-morning$/, { timeout: 10000 })
      const h = await open(me, '/trips/gwangneung-morning/history')
      const ht = await text(h.page)
      ok('AI proposal in history', ht.includes('AI 대안') && ht.includes(name), name)
      await shot(h.page, 'history_after_ai@m')
      const u = await open(me, '/trips/gwangneung-morning/ai?ask=' + encodeURIComponent('카페 한 곳 더 찾아줘'))
      await u.page.waitForURL(/\/ai\/unknown/, { timeout: 10000 }).catch(() => {})
      ok('AI unknown when nothing checked', u.page.url().includes('/ai/unknown'), u.page.url())
      await shot(u.page, 'ai_unknown@m')
    }

    // ── 시연 체크인 · QR 주소 ──
    {
      const { page } = await open(me, '/trips/gwangneung-morning/checkin')
      await page.getByRole('button', { name: '시연: 체크인하기' }).first().click()
      await page.waitForURL(/\/checkin\/done$/, { timeout: 10000 })
      const t = await text(page)
      ok('demo check-in → done with stamp', t.includes('광릉숲 전나무길 스탬프'), t.match(/광릉[^\n]*/g)?.join(' | '))
      await shot(page, 'checkin_done@m')
      const [{ day }] = await sql`select day::text as day from themes where id = 'byeollae-drip'`
      const sig = crypto.createHmac('sha256', SECRET).update(`checkin|byeollae-drip|${day}`).digest('base64url').slice(0, 16)
      const yuna = await ctxFor('yuna', 'm')
      const q = await open(yuna, `/c/byeollae-drip.${sig}`)
      await q.page.waitForURL(/\/checkin\/done$/, { timeout: 10000 }).catch(() => {})
      ok('QR /c/<token> → done', q.page.url().endsWith('/trips/byeollae-drip/checkin/done'), q.page.url())
      await shot(q.page, 'qr_checkin_done@m')
      const bad = await open(yuna, `/c/byeollae-drip.AAAAAAAAAAAAAAAA`)
      await bad.page.waitForFunction(() => document.body.innerText.includes('찾을 수 없어요'), null, { timeout: 8000 }).catch(() => {})
      const bt = await text(bad.page)
      ok('bad token → not found', bt.includes('찾을 수 없어요'), `${bad.status} ${bt.slice(0, 60).replace(/\n/g, ' ')}`)
      await yuna.close()
    }

    // ── 신청 취소(성사 전) ──
    {
      const { page } = await open(me, '/themes/dasan-lunch')
      await page.getByRole('button', { name: '신청 취소' }).first().click()
      await page.waitForURL(/\/cancel-done$/, { timeout: 10000 })
      ok('cancel → cancel-done', true)
      const [{ status }] = await sql`select a.status from applications a join users u on u.id = a.user_id
                                      where a.theme_id = 'dasan-lunch' and u.handle = 'kanghyun'`
      ok('application is 신청 취소', status === '신청 취소', status)
    }

    // ── 친구 초대: 지호(2명) → 민재가 링크로 신청 ──
    {
      const jiho = await ctxFor('jiho', 'm')
      const { page } = await open(jiho, '/themes/dumulmeori-sunset/apply?party=2')
      const sheet = page.locator('[role=dialog]').first()
      await sheet.locator('input[type=checkbox]').check()
      await sheet.getByRole('button', { name: '신청 보내기' }).click()
      await page.waitForURL(/\/invite$/, { timeout: 10000 })
      const link = (await page.locator('span.truncate').first().innerText()).trim()
      const joinPath = link.slice(link.indexOf('/themes/'))
      await shot(page, 'invite@m')
      const minjae = await ctxFor('minjae', 'm')
      const j = await open(minjae, joinPath)
      await shot(j.page, 'join@m')
      await j.page.getByRole('button', { name: '함께 신청하기' }).first().click()
      await j.page.waitForURL(/\/(applied|matched)$/, { timeout: 10000 })
      ok('friend joins via invite link', true, j.page.url())
      const inv = await open(jiho, '/themes/dumulmeori-sunset/invite')
      ok('inviter sees friend', (await text(inv.page)).includes('민재'))
      const rows = await sql`select u.handle, a.party, a.status from applications a join users u on u.id = a.user_id
                             where a.theme_id = 'dumulmeori-sunset' order by u.handle`
      ok('seat moved (jiho 1, minjae 1)', rows.find((r) => r.handle === 'jiho')?.party === 1 && rows.find((r) => r.handle === 'minjae')?.party === 1, JSON.stringify(rows))
      await jiho.close()
      await minjae.close()
    }

    // ── 테마 요청 ──
    {
      const [{ n: before }] = await sql`select count(*)::int n from theme_requests`
      const { page } = await open(me, '/request')
      await page.locator('#req-text').fill('비 오는 날 실내에서 차 마시는 코스요.')
      await page.getByRole('button', { name: '요청 남기기' }).first().click()
      await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 10000 })
      const [{ n: after }] = await sql`select count(*)::int n from theme_requests`
      ok('request inserted', after === before + 1, `${before} → ${after}`)
    }

    // ── 평가(여행 완료 · 함께 체크인한 사람) ──
    {
      const { page } = await open(me, '/trips/dasan-lunch-1114/review')
      await page.locator('fieldset', { hasText: '유나' }).first().getByRole('button', { name: '시간을 잘 지켜요' }).click()
      await page.locator('button:visible', { hasText: '평가 보내기' }).first().click()
      await page.waitForURL(/\/trips\/past$/, { timeout: 10000 })
      const rows = await sql`select r.tags from peer_reviews r join users f on f.id = r.from_user join users t on t.id = r.to_user
                             where r.theme_id = 'dasan-lunch-1114' and f.handle = 'kanghyun' and t.handle = 'yuna'`
      ok('peer review saved', rows[0]?.tags?.includes('시간을 잘 지켜요'), JSON.stringify(rows))
    }

    // ── 차단 ──
    {
      const { page } = await open(me, '/trips/gwangneung-morning/members/dohyun')
      await page.locator('[role=dialog] button', { hasText: '차단하기' }).first().click()
      await page.getByText('차단했어요').first().waitFor({ timeout: 10000 })
      const rows = await sql`select 1 from blocks b join users u on u.id = b.blocked_id join users m on m.id = b.user_id
                             where u.handle = 'dohyun' and m.handle = 'kanghyun'`
      ok('block saved', rows.length === 1)
    }

    // 다 끝난 뒤의 화면
    for (const p of ['/trips', '/trips/upcoming', '/trips/past', '/trips/gwangneung-morning']) {
      const { page } = await open(me, p)
      await shot(page, `after_${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')}@m`)
    }
  } catch (e) {
    results.push(`FAIL exception ${e.stack || e}`)
  } finally {
    console.log(results.join('\n'))
    if (errors.length) console.log(`BROWSER ERRORS\n${[...new Set(errors)].join('\n')}`)
    await (await browserP).close()
    await sql.end()
  }
})()
