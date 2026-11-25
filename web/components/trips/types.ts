// 내 여행 · 그룹 공간 화면이 받는 모양(서버 읽기 lib/server/queries/trips.ts가 만든다)
import type { BadgeTone } from '@/components/ui/primitives'
import type { ThemeView } from '@/lib/server/queries/theme-view'

export type TripBadge = { tone: BadgeTone; label: string }

/** 그룹 사람 한 명(호스트 포함). id = 주소에 쓰는 handle */
export type Member = {
  id: string
  userId: string
  name: string
  host?: boolean
  me?: boolean
  /** 남양주 주민 인증 · 진행한 테마 4회 / 상봉·중랑 출발 · 동행 3회 */
  line: string
  /** 더보기 시트의 한 줄 */
  sheetLine: string
  tags: string[]
  checkedIn?: boolean
}

/** 확인이 필요한 주요 변경 */
export type ChangeView = {
  id: string
  label: string
  from: string
  to: string
  where: string
  confirmed: string[]
  waiting: string[]
  total: number
  /** 내가 이미 확인했나 */
  mine: boolean
  at: string
}

export type HistoryItem = {
  id: string
  badge: TripBadge
  meta: string
  what: string
  from: string
  to: string
}

/** 그룹 여행 공간 하나 */
export type SpaceData = {
  t: ThemeView
  dday: string
  status: string
  members: Member[]
  change: ChangeView | null
  historyCount: number
  me: Member | null
  isHost: boolean
}

/** 대화 한 줄. system = 시스템 안내(userId 없음) */
export type ChatMsg = {
  id: string
  mine: boolean
  system: boolean
  from: string
  role?: string
  text: string
  time: string
  /** 11월 21일 토요일 */
  day: string
  at: string
}

export const displayName = (m: Member) => (m.me ? `${m.name} (나)` : m.name)
