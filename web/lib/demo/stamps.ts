// 시연 데이터 — 스탬프북(그룹 A). 핵심 장소에서 체크인하면 그 장소의 스탬프가 생긴다.
import { type Img, img, type Theme, themes } from './themes'

export type Region = { id: string; name: string }

export const regions: Region[] = [
  { id: 'paldang', name: '팔당·조안 수변' },
  { id: 'dasan', name: '다산·정약용 문화권' },
  { id: 'gwangneung', name: '광릉·진접 숲' },
  { id: 'winter', name: '2026 겨울' },
]

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

export const places: StampPlace[] = [
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
export const regionById = (id: string) => regions.find((r) => r.id === id)

const open = (t: Theme) => t.status === '모집 중' || t.status === '일정 조율 중'

/** 장소(또는 권역) 하나에서 지금 모집 중인 테마 */
export function recruitingFor(ids: string[]): Theme[] {
  return themes.filter((t) => ids.includes(t.id) && open(t))
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

/** 권역별 묶음(스탬프북 첫 탭) */
export const regionGroups = regions
  .filter((r) => r.id !== 'winter')
  .map((r) => {
    const ps = places.filter((p) => p.region === r.id)
    return {
      region: r,
      got: ps.filter((p) => p.visits).length,
      total: ps.length,
      cells: ps.map((p) => cellFor(p)),
    }
  })

export const stampCount = places.filter((p) => p.visits).length
export const regionCount = regionGroups.filter((g) => g.got > 0).length

/** 계절 시리즈 */
export const seasons = [
  {
    name: '2026 가을',
    aside: '2 / 4 · 11월 30일까지',
    closed: false,
    cells: [
      { ...cellFor(placeById('dumulmeori') as StampPlace, '가을 두물머리'), caption: '1회 · 11.8' },
      cellFor(placeById('gwangneung') as StampPlace, '가을 광릉숲'),
      cellFor(placeById('sujongsa') as StampPlace, '가을 수종사'),
      cellFor(placeById('water-garden') as StampPlace, '가을 물의정원'),
    ],
  },
  {
    name: '2026 겨울',
    aside: '12월에 열려요',
    closed: true,
    cells: places.filter((p) => p.region === 'winter').map((p) => cellFor(p)),
  },
]

/** 마이 화면(데스크톱) 스탬프 줄: 받은 3곳 + 모집 중인 빈 칸 2곳 */
export const myStampRow = ['dumulmeori', 'sujongsa', 'dasan-hanjeongsik', 'gwangneung', 'yeoyudang'].map(
  (id) => cellFor(placeById(id) as StampPlace),
)
