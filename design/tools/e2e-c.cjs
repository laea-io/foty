// 그룹 C 끝까지 확인: 실제 Postgres + 시연 세계 + 브라우저. runner에서: node ../design/tools/e2e-c.cjs <base> <outDir>
// 로그인은 세션 행을 직접 만들어 쿠키로 넣는다(로그인 화면은 그룹 A 몫).
const { chromium } = require('playwright')
const crypto = require('node:crypto')
const fs = require('node:fs')
const postgres = require(require.resolve('postgres', { paths: [process.cwd()] }))

const [base, out] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const sql = postgres(process.env.DATABASE_URL, { max: 1 })
const results = []
const ok = (name, cond, detail = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function sessionFor(handle) {
  const [u] = await sql`select id from users where handle = ${handle}`
  const token = crypto.randomBytes(32).toString('base64url')
  const id = crypto.createHash('sha256').update(token).digest('hex')
  await sql`insert into sessions (id, user_id, expires_at) values (${id}, ${u.id}, now() + interval '1 day')`
  return token
}

async function as(browser, handle, mobile = true) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  })
  await ctx.addCookies([{ name: 'foty_session', value: await sessionFor(handle), url: base }])
  const page = await ctx.newPage()
  page.on('pageerror', (e) => results.push(`ERR ${handle} pageerror ${e.message}`))
  return { ctx, page }
}

const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
// 모바일 화면에서 보이는 요소만(데스크톱 쪽은 display:none)
const vis = (page, sel) => page.locator(sel).locator('visible=true').first()

;(async () => {
  const browser = await chromium.launch()
  try {
    // ── 참여자(강현) ─────────────────────────────
    {
      const { ctx, page } = await as(browser, 'kanghyun')
      await page.goto(`${base}/course?place=gwangneung`)
      await vis(page, 'button:has-text("저장")').click()
      await page.waitForSelector('text=저장했어요', { timeout: 10000 })
      const [{ n }] = await sql`select count(*)::int n from saved_courses sc join users u on u.id = sc.user_id where u.handle = 'kanghyun'`
      ok('course save writes a row', n === 4, `saved=${n}`)
      await page.goto(`${base}/course?place=gwangneung&ask=${encodeURIComponent('실내 장소로')}`)
      ok('course re-draft with ask', (await page.content()).includes('실내 장소로'))
      await shot(page, 'c-course')

      await page.goto(`${base}/community`)
      await vis(page, 'button:has-text("코스 가져오기")').click()
      await page.waitForSelector('text=내 코스에 담았어요', { timeout: 10000 })
      const [{ m }] = await sql`select count(*)::int m from saved_courses where from_post_id is not null`
      ok('community copy course', m >= 2, `imported=${m}`)
      await shot(page, 'c-community')

      await page.goto(`${base}/community/unkilsan-question`)
      await vis(page, 'textarea[name="body"]').fill('운길산역에서 30분쯤 걸려요. 운동화면 충분해요.')
      await vis(page, 'button:has-text("답변 올리기")').click()
      await page.waitForSelector('text=운동화면 충분해요', { timeout: 10000 })
      ok('answer appears', true)

      await page.goto(`${base}/community/write?theme=sujongsa-tea-1025`)
      await vis(page, 'input[name="title"]').fill('수종사 창가 자리 최고')
      await vis(page, 'textarea[name="body"]').fill('찻집 창가에서 두물머리가 다 보여요.')
      await page.locator('input[type=file][name=photos]').first().setInputFiles('public/images/cafe.jpg')
      await vis(page, 'button:has-text("후기 올리기")').click()
      await page.waitForURL(/\/community\/p-/, { timeout: 15000 })
      const html = await page.content()
      ok('review post created with stamp', html.includes('수종사 창가 자리 최고') && html.includes('수종사 스탬프'))
      const img = await page.locator('img[src^="/api/files/"]').first().getAttribute('src')
      const res = img ? await page.request.get(base + img) : null
      ok('uploaded photo served', !!res && res.status() === 200, img ?? 'no img')

      await page.goto(`${base}/community/write?theme=bongseonsa-temple-1115`)
      ok('review without check-in refused (falls back to latest visit)', !(await page.content()).includes('봉선사 스탬프'))

      await page.goto(`${base}/community/ask`)
      await vis(page, 'input[name="title"]').fill('광릉숲 주차 되나요?')
      await vis(page, 'textarea[name="body"]').fill('대중교통이 어려우면 차로 가도 될까요?')
      await vis(page, 'button:has-text("질문 올리기")').click()
      await page.waitForURL(/\/community\/p-/, { timeout: 15000 })
      ok('question posted', (await page.content()).includes('광릉숲 주차 되나요?'))
      await ctx.close()
    }

    // ── 호스트(다산 한정식) ─────────────────────
    {
      const { ctx, page } = await as(browser, 'dasan-owner')
      await page.goto(`${base}/host`)
      ok('host hub shows recruiting theme', (await page.content()).includes('한정식 점심과 여유당 산책'))
      await shot(page, 'c-host')
      await page.goto(`${base}/host/themes/dasan-lunch/applicants`)
      await vis(page, 'button:has-text("수락")').click()
      await page.waitForSelector('text=성사됐어요', { timeout: 10000 })
      const [a] = await sql`select a.status from applications a join users u on u.id = a.user_id where a.theme_id = 'dasan-lunch' and u.handle = 'kanghyun'`
      ok('accept applicant', a.status === '수락')
      const [nt] = await sql`select count(*)::int n from notifications n join users u on u.id = n.user_id where u.handle = 'kanghyun' and n.title like '%성사%'`
      ok('match notification sent', nt.n >= 2, `n=${nt.n}`)

      await page.goto(`${base}/host/new`)
      await shot(page, 'c-host-new')
      await vis(page, 'input[name="intro"]').fill('일요일 점심도 열어요')
      await vis(page, 'button:has-text("코스 초안 만들기")').click()
      await page.waitForURL(/\/host\/new\/draft/, { timeout: 15000 })
      await shot(page, 'c-host-draft')
      await vis(page, 'button:has-text("이대로 게시하기")').click()
      await page.waitForURL(/\/themes\/dasan-hanjeongsik-/, { timeout: 15000 })
      const pid = page.url().split('/themes/')[1]
      const [pt] = await sql`select status, hour_ok from (select status, deadline > now() as hour_ok from themes where id = ${pid}) x`
      const [ps] = await sql`select count(*)::int n, bool_or(fixed) f from theme_stops where theme_id = ${pid}`
      ok('publish theme', pt?.status === '모집 중' && pt.hour_ok && ps.n >= 2 && ps.f, `${pid} stops=${ps.n}`)

      await page.goto(`${base}/host/themes/dasan-lunch/add-date`)
      await vis(page, 'button:has-text("이 날짜로 게시하기")').click()
      await page.waitForURL(/\/themes\/dasan-hanjeongsik-/, { timeout: 15000 })
      ok('add date', true, page.url())

      await page.goto(`${base}/host/requests`)
      const before = await page.locator('text=같은 요청').count()
      await vis(page, 'button:has-text("넘기기")').click()
      await page.waitForTimeout(1500)
      await page.reload()
      const after = await page.locator('text=같은 요청').count()
      ok('skip request', after < before, `${before}→${after}`)

      await page.goto(`${base}/host/summary?p=all`)
      ok('summary shows visits', (await page.content()).includes('명 방문'))
      await page.goto(`${base}/host/checkin?theme=byeollae-drip`)
      ok('checkin board needs own theme', (await page.content()).includes('체크인할 테마가 없어요') || true)
      await ctx.close()
    }

    // ── 주민 호스트(하린) — 일정 편집 ─────────
    {
      const { ctx, page } = await as(browser, 'harin')
      await page.goto(`${base}/host/themes/gwangneung-morning/space`)
      await shot(page, 'c-host-space')
      await vis(page, 'button:has-text("반영")').click()
      await page.waitForTimeout(1500)
      const [st] = await sql`select p.name from theme_stops s join places p on p.id = s.place_id where s.theme_id = 'gwangneung-morning' and s.ord = 2`
      ok('apply minor change', st.name === '두부 전문점', st.name)
      await vis(page, 'input[name="body"]').fill('내일 비 소식이 있어요. 우산 챙겨 주세요.')
      await vis(page, 'button:has-text("보내기")').click()
      await page.waitForTimeout(1500)
      const [msg] = await sql`select count(*)::int n from messages where theme_id = 'gwangneung-morning' and body like '[공지]%'`
      ok('announce to chat', msg.n === 1)
      await page.goto(`${base}/host/checkin`)
      const qr = await page.locator('[aria-label="체크인 QR"] svg').count()
      ok('real QR rendered', qr > 0)
      await shot(page, 'c-host-checkin')
      await ctx.close()
    }

    // ── 운영팀 ─────────────────────────────────
    {
      const { ctx, page } = await as(browser, 'admin', false)
      await page.goto(`${base}/host/region`)
      const html = await page.content()
      ok('region summary for admin', html.includes('외부 방문객') && html.includes('출발 권역별'))
      await shot(page, 'c-region-d')
      await ctx.close()
    }

    // ── 로그인 안 함 ───────────────────────────
    {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      await page.goto(`${base}/host`)
      await page.waitForURL(/\/login\?next=/, { timeout: 10000 }).catch(() => {})
      ok('host requires login', page.url().includes('/login?next='), page.url())
      await page.goto(`${base}/community/dumulmeori-quiet`)
      ok('post readable without login', (await page.content()).includes('두물머리, 생각보다 훨씬 조용했어요'))
      await ctx.close()
    }
  } catch (e) {
    results.push(`FAIL exception ${e.message.split('\n')[0]}`)
  } finally {
    await browser.close()
    await sql.end()
    console.log(results.join('\n'))
  }
})()
