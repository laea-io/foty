// 시연 데이터 — 내 여행 · 그룹 여행 공간. 디자인 캔버스의 예시를 그대로 옮겼다(기준일 2026-11-21).
import type { BadgeTone } from '@/components/ui/primitives'
import { type Img, img, type Theme, themeById } from './themes'

export type TripBadge = { tone: BadgeTone; label: string }

// ── 내 여행 목록 ─────────────────────────────────────
/** 신청 중(호스트 수락 전) */
export const applying: { id: string; badges: TripBadge[] }[] = [
  {
    id: 'dasan-lunch',
    badges: [
      { tone: 'soft', label: '신청 대기' },
      { tone: 'warn', label: '성사까지 1명' },
    ],
  },
  {
    id: 'dumulmeori-sunset',
    badges: [
      { tone: 'soft', label: '신청 대기' },
      { tone: 'warn', label: '성사까지 2명' },
    ],
  },
]

/** 예정(성사된 여행) */
export const upcoming: { id: string; dday: string; status: string; alert?: string; meet?: string }[] = [
  { id: 'gwangneung-morning', dday: 'D-1', status: '일정 조율 중', alert: '집결 시간 변경 확인이 필요해요' },
  { id: 'byeollae-drip', dday: 'D-7', status: '일정 확정', meet: '집결 13:20 · 상봉역 1번 출구' },
]

/** 취소된 신청 */
export const cancelled = [{ id: 'bongseonsa-temple', reason: '최소 인원이 모이지 않아 취소됐어요.' }]

/** 지난 여행 */
export const past: { id: string; check: TripBadge; note?: string; review?: string }[] = [
  {
    id: 'sujongsa-tea',
    check: { tone: 'ink', label: '참여 확인' },
    review: '평가는 11월 28일까지 남길 수 있어요',
  },
  {
    id: 'bongseonsa-temple',
    check: { tone: 'warn', label: '검토 중' },
    note: '체크인 기록이 없어 참여 여부를 확인하고 있어요. 호스트 확인과 맞춰 본 뒤 알려드릴게요.',
  },
]

export const tripTabs = (counts = { applying: applying.length, upcoming: upcoming.length }) => [
  { href: '/trips', label: `신청 중 ${counts.applying}` },
  { href: '/trips/upcoming', label: `예정 ${counts.upcoming}` },
  { href: '/trips/past', label: '지난 여행' },
]

export function themeOf(id: string): Theme {
  const t = themeById(id)
  if (!t) throw new Error(`theme ${id}`)
  return t
}

// ── 그룹 여행 공간 ──────────────────────────────────
export type Space = {
  id: string
  dday: string
  status: string
  /** 체크인한 시각(체크인 완료 화면) */
  checkinAt: string
  /** 스탬프 권역 설명 */
  stampNote: string
}

export const spaces: Space[] = [
  {
    id: 'gwangneung-morning',
    dday: 'D-1',
    status: '일정 조율 중',
    checkinAt: '09:34',
    stampNote: '광릉·진접 숲 · 이 권역의 첫 스탬프예요',
  },
  {
    id: 'byeollae-drip',
    dday: 'D-7',
    status: '일정 확정',
    checkinAt: '13:24',
    stampNote: '별내 · 이 권역의 첫 스탬프예요',
  },
  {
    id: 'sujongsa-tea',
    dday: '완료',
    status: '여행 완료',
    checkinAt: '10:34',
    stampNote: '조안 · 운길산 · 이 권역의 첫 스탬프예요',
  },
]

export const spaceById = (id: string) => spaces.find((s) => s.id === id)

export type Member = {
  id: string
  name: string
  host?: boolean
  me?: boolean
  /** 남양주 주민 인증 · 진행한 테마 4회 / 상봉역 출발 · 동행 3회 */
  line: string
  /** 더보기 시트의 한 줄 */
  sheetLine: string
  tags: string[]
  checkedIn?: boolean
}

/** 그룹 참여자(호스트 포함 5명) */
export const members: Member[] = [
  {
    id: 'harin',
    name: '하린',
    host: true,
    line: '남양주 주민 인증 · 진행한 테마 4회',
    sheetLine: '진접 · 진행한 테마 4회',
    tags: ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요'],
  },
  {
    id: 'yuna',
    name: '유나',
    line: '상봉역 출발 · 동행 3회',
    sheetLine: '상봉·중랑 출발 · 동행 3회',
    tags: ['서로를 배려해요'],
    checkedIn: true,
  },
  {
    id: 'jiho',
    name: '지호',
    line: '상봉역 출발 · 동행 1회',
    sheetLine: '상봉역 출발 · 동행 1회',
    tags: ['시간을 잘 지켜요'],
    checkedIn: true,
  },
  {
    id: 'dohyun',
    name: '도현',
    line: '구리역 출발',
    sheetLine: '구리역 출발 · 첫 동행',
    tags: ['첫 동행이에요'],
  },
  {
    id: 'kanghyun',
    name: '강현',
    me: true,
    line: '상봉역 출발',
    sheetLine: '상봉역 출발 · 첫 동행',
    tags: ['첫 동행이에요'],
  },
]

export const host = members[0]
export const guests = members.filter((m) => !m.host)
export const memberById = (id: string) => members.find((m) => m.id === id)
export const displayName = (m: Member) => (m.me ? `${m.name} (나)` : m.name)

/** 확인 요청 카드: 모든 참여자의 확인이 필요한 변경 */
export const changeRequest = {
  label: '집결 시간',
  from: '08:40',
  to: '08:20',
  where: '상봉역 · 호스트 하린',
  confirmed: ['하린', '유나', '지호'],
  waiting: ['도현', '강현'],
}

export type HistoryItem = {
  badge: TripBadge
  meta: string
  what: string
  from: string
  to: string
}

export const history: HistoryItem[] = [
  {
    badge: { tone: 'warn', label: '변경 확인 중' },
    meta: '호스트 하린 · 3 / 5명 확인',
    what: '집결 시간',
    from: '08:40',
    to: '08:20',
  },
  {
    badge: { tone: 'ink', label: '반영됨' },
    meta: '11.19 · 유나 제안 · 호스트 반영',
    what: '세 번째 장소',
    from: '두부 전문점',
    to: '숲길 밥상',
  },
  {
    badge: { tone: 'muted', label: '반려됨' },
    meta: '11.18 · AI 대안 · 도현 제안',
    what: '두 번째 장소',
    from: '봉선사',
    to: '카페 숲속',
  },
]

/** AI 도우미 */
export const aiChips = ['덜 걷는 코스로', '실내 장소로', '예산 줄이기']
export const aiSuggestions: { name: string; meta: string; image: Img }[] = [
  { name: '덕소 루프탑 카페', meta: '50분 · 약 8,000원', image: img.byeollae },
  { name: '강변 카페', meta: '60분 · 약 9,000원', image: img.cafe },
]

/** 평가 태그 */
export const reviewTags = ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요', '서로를 배려해요']
