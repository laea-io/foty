// 날짜는 모두 한국 시간 기준으로 보여 준다(서버 TZ와 무관하게).
const TZ = 'Asia/Seoul'
const DOW = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → { m, d, dow } (그날 한국 날짜 그대로) */
export function parts(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  const dow = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return { y, m, d, dow }
}

/** 11.21 (토) */
export function dayLabel(day: string) {
  const p = parts(day)
  return `${p.m}.${p.d} (${p.dow})`
}

/** 오늘(한국) 'YYYY-MM-DD' */
export function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now)
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

/** 한국 날짜·시각 → Date */
export function kst(day: string, hhmm = '00:00') {
  return new Date(`${day}T${hhmm}:00+09:00`)
}

/** 마감 표시: 11.20 (금) 18:00 */
export function deadlineLabel(at: Date) {
  const day = today(at)
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)
  return `${dayLabel(day)} ${hm}`
}

/** D-1 · D-day · 완료 */
export function dday(day: string, now = new Date()) {
  const t = today(now)
  const diff = Math.round((kst(day).getTime() - kst(t).getTime()) / 86400000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-day'
  return '완료'
}

/** 10:12 · 어제 · 11월 8일 */
export function ago(at: Date, now = new Date()) {
  const d = today(at)
  const t = today(now)
  if (d === t)
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(at)
  if (addDays(d, 1) === t) return '어제'
  const p = parts(d)
  return `${p.m}월 ${p.d}일`
}

export function hhmm(at: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)
}

/** 2.5만원 · 1.8만원 · 8,000원 */
export function won(n: number) {
  if (n >= 10000) return `${Number((n / 10000).toFixed(1))}만원`
  return `${n.toLocaleString('ko-KR')}원`
}
