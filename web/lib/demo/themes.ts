// 시연 데이터 — 테마. 디자인 캔버스의 예시를 그대로 옮겼다. 날짜 기준: 2026-11-21(토).
import type { BadgeTone } from '@/components/ui/primitives'

export const img = {
  hanjeongsik: { src: '/images/hanjeongsik.jpg', alt: '한정식', bg: '#e9e3d6' },
  forest: { src: '/images/gwangneung-forest.jpg', alt: '광릉숲 전나무길', bg: '#dfe4dc' },
  trail: { src: '/images/gwangneung-trail.jpg', alt: '광릉숲 관찰로', bg: '#dfe4dc' },
  dumulmeori: { src: '/images/dumulmeori.jpg', alt: '두물머리', bg: '#dde3e6' },
  boat: { src: '/images/dumulmeori-boat.jpg', alt: '두물머리 황포돛배', bg: '#dde3e6' },
  sujongsa: { src: '/images/sujongsa.jpg', alt: '수종사', bg: '#e8e1dc' },
  bongseonsa: { src: '/images/bongseonsa.jpg', alt: '봉선사', bg: '#e8e1dc' },
  yeoyudang: { src: '/images/yeoyudang.jpg', alt: '다산 유적지 여유당', bg: '#e2e1e6' },
  cafe: { src: '/images/cafe.jpg', alt: '카페', bg: '#e6e1d8' },
  byeollae: { src: '/images/byeollae-cafe.jpg', alt: '별내 카페거리', bg: '#e6e1d8' },
} as const
export type Img = { src: string; alt: string; bg: string }

/** 6장 상태 모델의 테마 상태 */
export type ThemeStatus = '모집 중' | '모집 마감' | '일정 조율 중' | '일정 확정' | '여행 완료' | '취소'

export type Stop = {
  name: string
  time: string
  stay: string
  kind: string
  /** 운영 정보 확인 시점. null이면 "재확인 필요" */
  checked: string | null
  /** 다음 장소까지 이동 */
  next?: string
  /** 핵심 장소(고정) */
  fixed?: boolean
  image: Img
  /** 지도 좌표(관광공사 장소만 있다) */
  lat?: number | null
  lng?: number | null
}

export type Theme = {
  id: string
  title: string
  /** 핵심 장소 */
  place: string
  area: string
  hostId: string
  /** 11.21 (토) */
  date: string
  /** 토 */
  dow: string
  start: string
  end: string
  current: number
  min: number
  max: number
  deadline: string
  from: string
  travel: string
  cost: string
  status: ThemeStatus
  image: Img
  route: string
  reason: string
  activities: string[]
  stops: Stop[]
  meet: string
  include: string
  exclude: string
}

export const themes: Theme[] = [
  {
    id: 'dasan-lunch',
    title: '한정식 점심과 여유당 산책',
    place: '다산 한정식',
    area: '조안면',
    hostId: 'dasan',
    date: '11.21 (토)',
    dow: '토',
    start: '11:30',
    end: '15:30',
    current: 2,
    min: 3,
    max: 6,
    deadline: '11.20 (금) 18:00',
    from: '상봉역',
    travel: '45분',
    cost: '2.5만원',
    status: '모집 중',
    image: img.hanjeongsik,
    route: '여유당 → 다산 한정식 → 두물머리 → 카페',
    reason: '날짜가 맞고, 맛집과 산책을 좋아해요',
    activities: ['맛집', '산책'],
    stops: [
      {
        name: '다산 유적지 여유당',
        time: '10:20',
        stay: '50분',
        kind: '문화 공간',
        checked: '11월 17일',
        next: '도보 8분',
        image: img.yeoyudang,
      },
      {
        name: '다산 한정식',
        time: '11:30',
        stay: '80분',
        kind: '점심',
        checked: '11월 18일',
        next: '버스 12분',
        fixed: true,
        image: img.hanjeongsik,
      },
      {
        name: '두물머리 산책',
        time: '13:20',
        stay: '60분',
        kind: '산책',
        checked: '11월 15일',
        next: '도보 5분',
        image: img.dumulmeori,
      },
      { name: '강변 카페', time: '14:30', stay: '50분', kind: '카페', checked: null, image: img.cafe },
    ],
    meet: '상봉역 1번 출구에서 모여 함께 이동해요. 상세 위치는 성사 후 공개돼요.',
    include: '한정식 1인 상차림',
    exclude: '교통비, 카페 음료 · 현장에서 각자 결제',
  },
  {
    id: 'byeollae-drip',
    title: '로스터리에서 배우는 핸드드립',
    place: '별내 로스터리',
    area: '별내동',
    hostId: 'byeollae',
    date: '11.21 (토)',
    dow: '토',
    start: '14:00',
    end: '17:00',
    current: 3,
    min: 3,
    max: 5,
    deadline: '11.20 (금) 18:00',
    from: '상봉역',
    travel: '25분',
    cost: '1.8만원',
    status: '일정 조율 중',
    image: img.byeollae,
    route: '별내 산책길 → 로스터리 → 빵집',
    reason: '날짜가 맞고, 카페를 좋아해요',
    activities: ['카페'],
    stops: [
      {
        name: '별내 산책길',
        time: '13:20',
        stay: '30분',
        kind: '산책',
        checked: '11월 16일',
        next: '도보 6분',
        image: img.byeollae,
      },
      {
        name: '별내 로스터리',
        time: '14:00',
        stay: '90분',
        kind: '체험',
        checked: '11월 18일',
        next: '도보 4분',
        fixed: true,
        image: img.cafe,
      },
      { name: '동네 빵집', time: '15:40', stay: '30분', kind: '빵집', checked: null, image: img.byeollae },
    ],
    meet: '별내역 2번 출구에서 모여요.',
    include: '핸드드립 체험, 원두 100g',
    exclude: '교통비, 빵 · 현장에서 각자 결제',
  },
  {
    id: 'sujongsa-tea',
    title: '수종사 찻집에서 보는 두물머리',
    place: '수종사',
    area: '조안면',
    hostId: 'jiho',
    date: '11.21 (토)',
    dow: '토',
    start: '10:30',
    end: '14:30',
    current: 4,
    min: 3,
    max: 4,
    deadline: '11.20 (금) 18:00',
    from: '상봉역',
    travel: '50분',
    cost: '1.5만원',
    status: '모집 마감',
    image: img.sujongsa,
    route: '운길산역 → 수종사 → 두물머리',
    reason: '날짜가 맞고, 자연을 좋아해요',
    activities: ['자연', '카페'],
    stops: [
      {
        name: '운길산역',
        time: '10:30',
        stay: '10분',
        kind: '집결',
        checked: '11월 17일',
        next: '도보 50분',
        image: img.sujongsa,
      },
      {
        name: '수종사',
        time: '11:30',
        stay: '90분',
        kind: '문화·자연',
        checked: '11월 17일',
        next: '버스 15분',
        fixed: true,
        image: img.sujongsa,
      },
      {
        name: '두물머리',
        time: '13:30',
        stay: '60분',
        kind: '산책',
        checked: '11월 15일',
        image: img.dumulmeori,
      },
    ],
    meet: '운길산역 1번 출구에서 모여요.',
    include: '찻값',
    exclude: '교통비, 점심 · 현장에서 각자 결제',
  },
  {
    id: 'dumulmeori-sunset',
    title: '두물머리 해 질 녘 사진 산책',
    place: '두물머리',
    area: '양서면',
    hostId: 'seoyeon',
    date: '11.21 (토)',
    dow: '토',
    start: '16:00',
    end: '19:00',
    current: 1,
    min: 3,
    max: 6,
    deadline: '11.20 (금) 18:00',
    from: '상봉역',
    travel: '40분',
    cost: '1만원',
    status: '모집 중',
    image: img.boat,
    route: '물의정원 → 두물머리 → 찻집',
    reason: '날짜가 맞고, 사진을 좋아해요',
    activities: ['사진', '산책'],
    stops: [
      {
        name: '물의정원',
        time: '15:20',
        stay: '30분',
        kind: '산책',
        checked: '11월 15일',
        next: '버스 10분',
        image: img.dumulmeori,
      },
      {
        name: '두물머리',
        time: '16:00',
        stay: '90분',
        kind: '사진',
        checked: '11월 15일',
        next: '도보 5분',
        fixed: true,
        image: img.boat,
      },
      { name: '강가 찻집', time: '17:40', stay: '50분', kind: '카페', checked: null, image: img.cafe },
    ],
    meet: '양수역 1번 출구에서 모여요.',
    include: '없음',
    exclude: '교통비, 찻값 · 현장에서 각자 결제',
  },
  {
    id: 'gwangneung-morning',
    title: '광릉숲 전나무길 아침 산책',
    place: '광릉숲',
    area: '진접읍',
    hostId: 'harin',
    date: '11.22 (일)',
    dow: '일',
    start: '09:30',
    end: '13:50',
    current: 4,
    min: 3,
    max: 6,
    deadline: '11.21 (토) 18:00',
    from: '상봉역',
    travel: '55분',
    cost: '1.5만원',
    status: '일정 조율 중',
    image: img.forest,
    route: '광릉숲 → 봉선사 → 숲길 밥상',
    reason: '날짜가 맞고, 여유로운 산책을 선호해요',
    activities: ['자연', '산책'],
    stops: [
      {
        name: '광릉숲 전나무길',
        time: '09:30',
        stay: '90분',
        kind: '산책',
        checked: '11월 15일',
        next: '도보 15분',
        fixed: true,
        image: img.forest,
      },
      {
        name: '봉선사',
        time: '11:20',
        stay: '50분',
        kind: '문화·자연',
        checked: '11월 15일',
        next: '버스 10분',
        image: img.bongseonsa,
      },
      {
        name: '숲길 밥상',
        time: '12:40',
        stay: '70분',
        kind: '점심',
        checked: '11월 18일',
        image: img.hanjeongsik,
      },
    ],
    meet: '상봉역 2번 출구에서 08:20에 모여 함께 이동해요.',
    include: '없음',
    exclude: '교통비, 점심 · 현장에서 각자 결제',
  },
  {
    id: 'bongseonsa-temple',
    title: '봉선사 연등길과 사찰음식 한 끼',
    place: '봉선사',
    area: '진접읍',
    hostId: 'supgil',
    date: '11.22 (일)',
    dow: '일',
    start: '11:00',
    end: '15:00',
    current: 2,
    min: 3,
    max: 5,
    deadline: '11.21 (토) 18:00',
    from: '상봉역',
    travel: '55분',
    cost: '2만원',
    status: '모집 중',
    image: img.bongseonsa,
    route: '광릉숲 → 봉선사 → 사찰음식',
    reason: '날짜가 맞고, 문화 공간을 좋아해요',
    activities: ['문화 공간', '맛집'],
    stops: [
      {
        name: '광릉숲 관찰로',
        time: '10:00',
        stay: '50분',
        kind: '산책',
        checked: '11월 15일',
        next: '도보 15분',
        image: img.trail,
      },
      {
        name: '봉선사',
        time: '11:00',
        stay: '60분',
        kind: '문화·자연',
        checked: '11월 15일',
        next: '도보 5분',
        fixed: true,
        image: img.bongseonsa,
      },
      {
        name: '숲길 밥상',
        time: '12:10',
        stay: '70분',
        kind: '사찰음식',
        checked: '11월 18일',
        image: img.hanjeongsik,
      },
    ],
    meet: '상봉역 2번 출구에서 모여요.',
    include: '사찰음식 한 상',
    exclude: '교통비 · 현장에서 각자 결제',
  },
]

export const themeById = (id: string) => themes.find((t) => t.id === id)

/** 목록 카드 오른쪽 배지: 성사 여부가 먼저, 그다음 테마 상태 */
export function themeBadge(t: Theme): { tone: BadgeTone; label: string } {
  if (t.status === '취소') return { tone: 'muted', label: '취소' }
  if (t.status === '모집 마감') return { tone: 'soft', label: '모집 마감' }
  if (t.status === '여행 완료') return { tone: 'soft', label: '여행 완료' }
  if (t.current >= t.min) return { tone: 'ink', label: '성사' }
  return { tone: 'warn', label: `성사까지 ${t.min - t.current}명` }
}

/** 7일 달력(홈 상단). 시연 기준일 11.21(토) */
export const week = [
  { day: 21, dow: '오늘', date: '11.21 (토)' },
  { day: 22, dow: '일', date: '11.22 (일)' },
  { day: 23, dow: '월', date: '11.23 (월)' },
  { day: 24, dow: '화', date: '11.24 (화)' },
  { day: 25, dow: '수', date: '11.25 (수)' },
  { day: 26, dow: '목', date: '11.26 (목)' },
  { day: 27, dow: '금', date: '11.27 (금)' },
]

export const origins = ['상봉역', '청량리역', '잠실역', '구리역']
export const activityList = ['자연', '산책', '카페', '맛집', '사진', '문화 공간']
export const budgets = ['1만원 이하', '2만원 이하', '3만원 이하', '상관없음']
