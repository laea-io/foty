// 홈 조건(날짜·출발지·이동수단·활동·예산)은 주소 쿼리로 들고 다닌다 → 조건 입력 화면(/filter)과 홈이 같은 값을 본다.
import { type Theme, themes, week } from './themes'

export type HomeQuery = {
  view?: 'weekend' | 'next' | 'all'
  day?: string // '21' …
  origin?: string
  transit?: '1' | '0'
  budget?: string
  act?: string // 쉼표로 여러 개
}

export function parseQuery(sp: Record<string, string | string[] | undefined>): HomeQuery {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined
  const view = one('view')
  return {
    view: view === 'next' || view === 'all' ? view : 'weekend',
    day: one('day'),
    origin: one('origin') ?? '상봉역',
    transit: one('transit') === '0' ? '0' : '1',
    budget: one('budget'),
    act: one('act'),
  }
}

export function toSearch(q: HomeQuery) {
  const p = new URLSearchParams()
  if (q.view && q.view !== 'weekend') p.set('view', q.view)
  if (q.day) p.set('day', q.day)
  if (q.origin && q.origin !== '상봉역') p.set('origin', q.origin)
  if (q.transit === '0') p.set('transit', '0')
  if (q.budget) p.set('budget', q.budget)
  if (q.act) p.set('act', q.act)
  const s = p.toString()
  return s ? `?${s}` : ''
}

// 시연: 이동 시간은 상봉역 기준으로만 있다 → 다른 출발지는 대략의 차이를 더한다.
const originOffset: Record<string, number> = { 상봉역: 0, 청량리역: 10, 구리역: -10, 잠실역: 20 }
const budgetMax: Record<string, number> = { '1만원 이하': 1, '2만원 이하': 2, '3만원 이하': 3 }

export function withOrigin(t: Theme, origin = '상봉역'): Theme {
  const off = originOffset[origin] ?? 0
  const min = Number.parseInt(t.travel, 10) + off
  return { ...t, from: origin, travel: `${min}분` }
}

export function filterThemes(q: HomeQuery): Theme[] {
  if (q.view === 'next') return []
  let list = themes
  if (q.day) {
    const d = week.find((w) => String(w.day) === q.day)
    list = d ? list.filter((t) => t.date === d.date) : []
  }
  if (q.budget && budgetMax[q.budget])
    list = list.filter((t) => Number.parseFloat(t.cost) <= budgetMax[q.budget as string])
  if (q.act) {
    const acts = q.act.split(',')
    list = list.filter((t) => t.activities.some((a) => acts.includes(a)))
  }
  return list.map((t) => withOrigin(t, q.origin))
}

/** 빈 화면에 보여 줄 조건 요약: "11.21 (토) · 잠실역 출발 · 1만원 이하" */
export function describe(q: HomeQuery) {
  const d = week.find((w) => String(w.day) === q.day)
  return [q.view === 'next' ? '다음 주' : (d?.date ?? '이번 주말'), `${q.origin} 출발`, q.budget]
    .filter(Boolean)
    .join(' · ')
}
