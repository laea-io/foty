// 홈 조건(날짜·출발지·이동수단·활동·예산)은 주소 쿼리로 들고 다닌다 → 조건 입력 화면(/filter)과 홈이 같은 값을 본다.

export type HomeQuery = {
  view?: 'weekend' | 'next' | 'all'
  /** 하루만: 'YYYY-MM-DD' */
  day?: string
  origin?: string
  /** 출발지가 '내 위치'일 때 좌표 "37.59,127.08" */
  at?: string
  transit?: '1' | '0'
  budget?: string
  act?: string // 쉼표로 여러 개
}

export function parseQuery(sp: Record<string, string | string[] | undefined>): HomeQuery {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined
  const view = one('view')
  return {
    view: view === 'next' || view === 'all' ? view : 'weekend',
    day: /^\d{4}-\d{2}-\d{2}$/.test(one('day') ?? '') ? one('day') : undefined,
    origin: one('origin'),
    at: /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(one('at') ?? '') ? one('at') : undefined,
    transit: one('transit') === '0' ? '0' : '1',
    budget: one('budget'),
    act: one('act'),
  }
}

export function toSearch(q: HomeQuery) {
  const p = new URLSearchParams()
  if (q.view && q.view !== 'weekend') p.set('view', q.view)
  if (q.day) p.set('day', q.day)
  if (q.origin) p.set('origin', q.origin)
  if (q.at && q.origin === '내 위치') p.set('at', q.at)
  if (q.transit === '0') p.set('transit', '0')
  if (q.budget) p.set('budget', q.budget)
  if (q.act) p.set('act', q.act)
  const s = p.toString()
  return s ? `?${s}` : ''
}
