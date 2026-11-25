// 시연 데이터 — 스탬프북. /design 쇼케이스(DEMO_MODE)에서만 쓴다.
import { themes } from '@/lib/demo/themes'
import type { Cell, StampPlace } from '@/lib/shared/stamps'
import { img, type Theme } from '@/lib/shared/theme'

export type Region = { id: string; name: string }

const places: StampPlace[] = [
  {
    id: 'dumulmeori',
    name: '두물머리',
    region: 'paldang',
    visits: 2,
    last: '11.8',
    image: img.dumulmeori,
    records: [
      { title: '두물머리 해 질 녘 사진 산책', date: '11.8 (일)', themeId: 'dumulmeori-sunset' },
      { title: '두물머리 아침 산책과 찻집', date: '10.11 (일)' },
    ],
  },
  {
    id: 'sujongsa',
    name: '수종사',
    region: 'paldang',
    visits: 1,
    last: '10.25',
    image: img.sujongsa,
    records: [{ title: '수종사 찻집에서 보는 두물머리', date: '10.25 (토)', themeId: 'sujongsa-tea' }],
  },
  { id: 'water-garden', name: '물의정원', region: 'paldang', themeIds: ['dumulmeori-sunset'] },
  { id: 'paldang-view', name: '팔당 전망대', region: 'paldang', themeIds: [] },
  {
    id: 'dasan-hanjeongsik',
    name: '다산 한정식',
    region: 'dasan',
    visits: 1,
    last: '11.14',
    image: img.hanjeongsik,
    records: [{ title: '한정식 점심과 여유당 산책', date: '11.14 (토)', themeId: 'dasan-lunch' }],
  },
  { id: 'yeoyudang', name: '여유당', region: 'dasan', themeIds: ['dasan-lunch'] },
  { id: 'silhak', name: '실학박물관', region: 'dasan', themeIds: [] },
  {
    id: 'gwangneung',
    name: '광릉숲',
    region: 'gwangneung',
    themeIds: ['gwangneung-morning', 'bongseonsa-temple'],
  },
  { id: 'bongseonsa', name: '봉선사', region: 'gwangneung', themeIds: ['bongseonsa-temple'] },
  { id: 'supgil', name: '숲길 밥상', region: 'gwangneung', themeIds: [] },
  { id: 'winter-tea', name: '겨울 찻집', region: 'winter', themeIds: [] },
  { id: 'winter-river', name: '겨울 수변 산책', region: 'winter', themeIds: [] },
  { id: 'winter-table', name: '겨울 한 상', region: 'winter', themeIds: [] },
]

export const placeById = (id: string) => places.find((p) => p.id === id)

const open = (t: Theme) => t.status === '모집 중' || t.status === '일정 조율 중'

/** 장소(또는 권역) 하나에서 지금 모집 중인 테마 */
function recruitingFor(ids: string[]): Theme[] {
  return themes.filter((t) => ids.includes(t.id) && open(t))
}

export function cellFor(p: StampPlace, name = p.name): Cell {
  if (p.visits)
    return { id: p.id, name, got: true, caption: `${p.visits}회 · ${p.last}`, href: `/my/stamps/${p.id}` }
  const n = recruitingFor(p.themeIds ?? []).length
  return {
    id: p.id,
    name,
    got: false,
    caption: n ? `모집 중 ${n}` : '테마 없음',
    live: n > 0,
    href: `/my/stamps/region/${p.id}`,
  }
}
