// 시연 검색 — 테마는 제목·핵심 장소로, 코스는 장소 이름으로, 후기는 제목으로 찾는다(그룹 A).
import { type Theme, themes } from './themes'

/** 커뮤니티 후기(검색 개수용 시연 목록) */
const reviews = [
  '두물머리 해 질 녘, 휴대폰으로도 충분했어요',
  '광릉숲 아침 공기가 정말 달랐어요',
  '별내 로스터리 핸드드립 후기',
]

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()

export function searchAll(q: string): { themes: Theme[]; courses: number; reviews: number } {
  const k = norm(q)
  if (!k) return { themes, courses: themes.length, reviews: reviews.length }
  return {
    themes: themes.filter((t) => norm(t.title).includes(k) || norm(t.place).includes(k)),
    courses: themes.filter((t) => t.stops.some((s) => norm(s.name).includes(k))).length,
    reviews: reviews.filter((r) => norm(r).includes(k)).length,
  }
}

/** 결과가 없을 때 보여 줄 추천 검색어 */
export const suggestions = ['산책', '카페', '두물머리']
/** 검색어 없이 들어왔을 때의 시연 검색어 */
export const demoQuery = '두물머리'
