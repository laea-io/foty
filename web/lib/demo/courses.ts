// 시연 데이터 — 코스(핵심 장소 하나 + 앞뒤 장소). 검토된 샘플 장소만 쓴다(실시간 검색 아님).
import { type Img, img, type Stop, type Theme, themeById, themes } from './themes'

export type Place = {
  id: string
  name: string
  area: string
  kind: string
  /** 운영 정보 확인 시점. null이면 재확인 필요 */
  checked: string | null
  image: Img
  /** 이 장소를 핵심으로 할 때 쓸 코스 원본(테마) */
  from: string
  group: '자연' | '카페' | '맛집' | '문화 공간'
}

export const places: Place[] = [
  {
    id: 'sujongsa',
    name: '수종사',
    area: '조안면',
    kind: '문화·자연',
    checked: '11월 15일',
    image: img.sujongsa,
    from: 'sujongsa-tea',
    group: '문화 공간',
  },
  {
    id: 'dumulmeori',
    name: '두물머리',
    area: '조안면',
    kind: '자연',
    checked: '11월 15일',
    image: img.dumulmeori,
    from: 'dumulmeori-sunset',
    group: '자연',
  },
  {
    id: 'gwangneung',
    name: '광릉숲',
    area: '진접읍',
    kind: '자연',
    checked: '11월 15일',
    image: img.forest,
    from: 'gwangneung-morning',
    group: '자연',
  },
  {
    id: 'dasan',
    name: '다산 한정식',
    area: '조안면',
    kind: '맛집',
    checked: '11월 18일',
    image: img.hanjeongsik,
    from: 'dasan-lunch',
    group: '맛집',
  },
  {
    id: 'yeoyudang',
    name: '다산 유적지 여유당',
    area: '조안면',
    kind: '문화 공간',
    checked: '11월 17일',
    image: img.yeoyudang,
    from: 'dasan-lunch',
    group: '문화 공간',
  },
  {
    id: 'riverside-cafe',
    name: '강변 카페',
    area: '조안면',
    kind: '카페',
    checked: null,
    image: img.cafe,
    from: 'dasan-lunch',
    group: '카페',
  },
]

export const placeById = (id?: string) => places.find((p) => p.id === id) ?? places[3]

export type Course = {
  place: Place
  date: string
  hours: string
  cost: string
  move: string
  stops: Stop[]
  /** 이 코스 안의 장소에 열린 테마 */
  open: Theme[]
}

const hours = (stops: Stop[]) => {
  const h = (s: string) => Number(s.slice(0, 2)) + Number(s.slice(3)) / 60
  const last = stops[stops.length - 1]
  const end = h(last.time) + Number.parseInt(last.stay, 10) / 60
  return `${Math.round(end - h(stops[0].time))}시간`
}

/** 핵심 장소 하나로 하루 코스 만들기 — 원본 테마의 장소를 쓰고, 고정은 핵심 장소로 옮긴다 */
export function courseFor(placeId?: string): Course {
  const place = placeById(placeId)
  const base = themeById(place.from) ?? themes[0]
  // 핵심 장소와 이름이 같은 칸을 고정한다(없으면 원본 테마의 고정 칸 그대로)
  const hit = base.stops.findIndex((st) => st.name.startsWith(place.name) || place.name.startsWith(st.name))
  const stops = base.stops.map((st, i) => ({ ...st, fixed: hit >= 0 ? i === hit : st.fixed }))
  const names = stops.map((s) => s.name)
  const open = themes.filter(
    (t) =>
      (t.status === '모집 중' || t.status === '일정 조율 중') && t.stops.some((s) => names.includes(s.name)),
  )
  return {
    place,
    date: base.date,
    hours: hours(stops),
    cost: base.cost,
    move: '대중교통',
    stops,
    open: open.slice(0, 2),
  }
}

/** 이 장소에 열린 테마 수 */
export const openThemeCount = (p: Place) =>
  themes.filter(
    (t) => t.status !== '모집 마감' && t.status !== '취소' && t.place.startsWith(p.name.slice(0, 2)),
  ).length

export type SavedCourse = { id: string; title: string; meta: string; image: Img }

export const savedCourses: { mine: SavedCourse[]; imported: SavedCourse[] } = {
  mine: [
    { id: 'dasan', title: '다산 한정식 코스', meta: '4곳 · 5시간 · 11.21 (토)', image: img.hanjeongsik },
    {
      id: 'sujongsa',
      title: '수종사에서 두물머리까지',
      meta: '3곳 · 4시간 · 날짜 미정',
      image: img.sujongsa,
    },
  ],
  imported: [
    {
      id: 'gwangneung',
      title: '광릉숲과 봉선사, 반나절 코스',
      meta: '지호 님의 후기에서 가져왔어요',
      image: img.forest,
    },
  ],
}
