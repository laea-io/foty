import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { testDb } from '@/test/db'

// env는 불러올 때 한 번 읽으니, 키를 넣고 모듈을 새로 불러온다. 네트워크는 가짜 fetch로.
const reply = (content: unknown, ok = true) =>
  vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
  }))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('OPENAI_API_KEY', 'sk-test')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('AI helper (OpenAI)', () => {
  it('keeps only ids from the reviewed candidates', async () => {
    const t = await testDb()
    // 후보는 규칙 쪽이 쓰는 같은 권역 목록 — 키 없이 먼저 하나 얻는다
    vi.stubEnv('OPENAI_API_KEY', '')
    const pre = await import('@/lib/server/domain/suggest')
    const { places: all } = await pre.suggestPlaces(t.db, {
      corePlaceId: 'dasan-hanjeongsik',
      ask: 'zzz',
      n: 50,
    })
    const pick = all[0]
    expect(pick).toBeTruthy()
    vi.resetModules()
    vi.stubEnv('OPENAI_API_KEY', 'sk-test')
    const fetch = reply({ ids: ['made-up-place', pick.id], label: '조용한 곳', reason: '덜 붐벼요.' })
    vi.stubGlobal('fetch', fetch)
    const { suggestPlaces } = await import('@/lib/server/domain/suggest')
    const r = await suggestPlaces(t.db, { corePlaceId: 'dasan-hanjeongsik', ask: '사람 적은 곳', n: 3 })
    expect(r.places.map((p) => p.id)).toEqual([pick.id])
    expect(r.understood).toBe(true)
    expect(r.label).toBe('조용한 곳')
    const body = JSON.parse((fetch.mock.calls.at(-1) as unknown as [string, { body: string }])[1].body)
    expect(body.messages[1].content).toContain('사람 적은 곳')
  })

  it('falls back to the rules when OpenAI fails', async () => {
    const t = await testDb()
    vi.stubGlobal('fetch', reply({}, false))
    const { suggestPlaces } = await import('@/lib/server/domain/suggest')
    const r = await suggestPlaces(t.db, { corePlaceId: 'dasan-hanjeongsik', ask: '카페 한 곳 더', n: 2 })
    expect(r.understood).toBe(true)
    expect(r.reason).toBeUndefined()
    expect(r.places.length).toBeGreaterThan(0)
    expect(r.places.every((p) => p.group === '카페')).toBe(true)
  })

  it('empty pick means "not understood" (no forced answer)', async () => {
    const t = await testDb()
    vi.stubGlobal('fetch', reply({ ids: [], label: '', reason: '맞는 곳이 없어요.' }))
    const { suggestPlaces } = await import('@/lib/server/domain/suggest')
    const r = await suggestPlaces(t.db, { corePlaceId: 'dasan-hanjeongsik', ask: '스키장', n: 2 })
    expect(r.understood).toBe(false)
    expect(r.places).toEqual([])
  })

  it('draft keeps the core fixed and uses AI picks around it', async () => {
    const t = await testDb()
    const fetch = reply({ ids: [], label: '', reason: '' })
    vi.stubGlobal('fetch', fetch)
    const { draftCourse } = await import('@/lib/server/domain/suggest')
    const base = await draftCourse(t.db, { corePlaceId: 'dasan-hanjeongsik', start: '11:30' })
    expect(fetch).not.toHaveBeenCalled() // 요청이 없으면 부르지 않는다
    const other = base.find((d) => !d.fixed)
    if (!other) return
    fetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          { message: { content: JSON.stringify({ ids: [other.placeId], label: 'x', reason: 'y' }) } },
        ],
      }),
    }))
    const d = await draftCourse(t.db, { corePlaceId: 'dasan-hanjeongsik', start: '11:30', ask: '조용하게' })
    expect(d.map((x) => x.placeId).sort()).toEqual(['dasan-hanjeongsik', other.placeId].sort())
    expect(d.find((x) => x.fixed)?.time).toBe('11:30')
  })
})
