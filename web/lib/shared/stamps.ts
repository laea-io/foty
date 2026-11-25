// 스탬프북 모양 — 장소, 방문, 칸(서버·브라우저 공용).
import type { Img } from '@/lib/shared/theme'

export type Visit = { title: string; date: string; themeId?: string }

export type StampPlace = {
  id: string
  name: string
  region: string
  /** 받은 스탬프: 방문 횟수 · 마지막 방문 */
  visits?: number
  last?: string
  image?: Img
  records?: Visit[]
  /** 이 장소를 핵심으로 모집 중인 테마(빈 칸을 누르면 보여 준다) */
  themeIds?: string[]
}

/** 스탬프 칸 하나(이름 · 아래 줄 · 이동 주소) */
export type Cell = {
  id: string
  name: string
  got: boolean
  /** "2회 · 11.8" · "모집 중 2" · "테마 없음" */
  caption: string
  /** 모집 중 링크 모양(밑줄) */
  live?: boolean
  href: string
}
