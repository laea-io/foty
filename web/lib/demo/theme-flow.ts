// 시연 데이터 — 테마 참여 흐름(신청·성사·취소·초대)과 상태별 상세. 디자인 캔버스의 예시를 그대로 옮겼다.
import type { BadgeTone } from '@/components/ui/primitives'
import { hostById } from './people'
import { type Theme, themeById, themes } from './themes'
import { members } from './trips'

/** 같은 테마의 다른 날짜 한 줄 */
export type OtherDate = {
  label: string
  current: number
  min: number
  badge: { tone: BadgeTone; label: string }
}

const dateBadge = (current: number, min: number) =>
  current === 0
    ? { tone: 'soft' as const, label: '모집 중' }
    : { tone: 'warn' as const, label: `성사까지 ${min - current}명` }

const nextWeek: Record<string, string> = { '11.21 (토)': '11.28 (토)', '11.22 (일)': '11.29 (일)' }
const twoWeeks: Record<string, string> = { '11.21 (토)': '12.5 (토)', '11.22 (일)': '12.6 (일)' }

/** 모집 마감·취소 화면의 “같은 테마의 다른 날짜” */
export function otherDates(t: Theme, kind: 'closed' | 'cancelled' | 'host-cancelled'): OtherDate[] {
  const d1 = `${nextWeek[t.date] ?? t.date} ${t.start}`
  const d2 = `${twoWeeks[t.date] ?? t.date} ${t.start}`
  if (kind === 'closed') return [{ label: d1, current: 1, min: t.min, badge: dateBadge(1, t.min) }]
  if (kind === 'host-cancelled') return [{ label: d1, current: 0, min: t.min, badge: dateBadge(0, t.min) }]
  return [
    { label: d1, current: 2, min: t.min, badge: dateBadge(2, t.min) },
    { label: d2, current: 0, min: t.min, badge: dateBadge(0, t.min) },
  ]
}

/** 비슷한 테마: 활동이 겹치는 다른 테마부터 */
export function similarThemes(t: Theme, n = 2): Theme[] {
  const others = themes.filter((x) => x.id !== t.id)
  const near = others.filter((x) => x.activities.some((a) => t.activities.includes(a)))
  return [...near, ...others.filter((x) => !near.includes(x))].slice(0, n)
}

/** 여행 완료 화면의 “이 호스트의 새 테마”(없으면 다른 호스트의 테마) */
export function hostThemes(t: Theme): Theme[] {
  const same = themes.filter((x) => x.hostId === t.hostId && x.id !== t.id)
  return same.length ? same.slice(0, 1) : [themeById('sujongsa-tea') as Theme]
}

/** “상봉역 1번 출구에서 모여…” → “상봉역 1번 출구” */
const meetPlace = (t: Theme) => t.meet.split('에서')[0]

/** 성사 직후 공개된 집결(변경 전) · 확정된 집결 */
export function meetFor(t: Theme, confirmed = false) {
  if (t.id === 'gwangneung-morning') return `${confirmed ? '08:20' : '08:40'} · 상봉역 1번 출구`
  return `${t.start} · ${meetPlace(t)}`
}

/** 성사 화면의 아바타 줄: 호스트 + 참여자 */
export function matchedPeople(t: Theme) {
  const host = hostById(t.hostId)?.name ?? '호스트'
  const guests = members.filter((m) => !m.host).map((m) => m.name)
  return { host, names: [host, ...guests], guests: guests.length }
}

/** 친구 초대 링크(시연) */
export const inviteLink = (t: Theme) =>
  `foty.kr/t/${t.id.split('-')[0]}-${t.date.slice(0, 5).replace('.', '')}?with=강현`

/** 친구 신청 마감(테마 모집 마감 6시간 전) */
export const inviteDeadline = (t: Theme) => t.deadline.replace('18:00', '12:00')

/** 호스트가 취소하며 남긴 말 */
export function hostCancelNote(t: Theme) {
  const host = hostById(t.hostId)?.name ?? '호스트'
  const text =
    t.id === 'byeollae-drip'
      ? '기계 점검이 겹쳐 이번 주는 열기 어려워졌어요. 다음 주 같은 시간에 다시 열게요.'
      : '사정이 생겨 이번 주는 열기 어려워졌어요. 다음 주 같은 시간에 다시 열게요.'
  return { host, text }
}
