// 테마 모양 — 화면 부품이 받는 Theme·Stop 타입, 상태 배지, 고를 수 있는 활동·예산(서버·브라우저 공용).
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
  /** 장소 정보 출처(관광공사 등). 없으면 사진 출처 화면으로 */
  sourceUrl?: string | null
}

export type Theme = {
  /** 호스트 이름·종류(DB). 시안 데이터에는 없다 */
  hostName?: string
  hostKind?: 'business' | 'resident'
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

/** 목록 카드 오른쪽 배지: 성사 여부가 먼저, 그다음 테마 상태 */
export function themeBadge(t: Theme): { tone: BadgeTone; label: string } {
  if (t.status === '취소') return { tone: 'muted', label: '취소' }
  if (t.status === '모집 마감') return { tone: 'soft', label: '모집 마감' }
  if (t.status === '여행 완료') return { tone: 'soft', label: '여행 완료' }
  if (t.current >= t.min) return { tone: 'ink', label: '성사' }
  return { tone: 'warn', label: `성사까지 ${t.min - t.current}명` }
}
export const activityList = ['자연', '산책', '카페', '맛집', '사진', '문화 공간']
export const budgets = ['1만원 이하', '2만원 이하', '3만원 이하', '5만원 이하', '상관없음']
