// 화면 캡처: node shot.cjs <outDir> <base> <path>[@m|@d] ...  (m=390 모바일, d=1440 데스크톱, 없으면 둘 다)
const { chromium } = require('playwright')
const fs = require('node:fs')
;(async () => {
  const [out, base, ...paths] = process.argv.slice(2)
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  const errors = []
  for (const spec of paths) {
    const [p, mode] = spec.split('@')
    for (const m of mode ? [mode] : ['m', 'd']) {
      const ctx = await browser.newContext({
        viewport: m === 'm' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      })
      const page = await ctx.newPage()
      page.on('pageerror', (e) => errors.push(`${p}@${m} pageerror ${e.message}`))
      page.on('console', (msg) => msg.type() === 'error' && errors.push(`${p}@${m} console ${msg.text()}`))
      const res = await page.goto(base + p, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400)
      const name = `${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}@${m}.png`
      await page.screenshot({ path: `${out}/${name}`, fullPage: true })
      console.log(res.status(), p, m, name)
      await ctx.close()
    }
  }
  await browser.close()
  if (errors.length) console.log('ERRORS\n' + errors.join('\n'))
})()
