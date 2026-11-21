// 시연 데이터 — 커뮤니티 글. 실제 후기가 아니다(화면에 "시연용 예시" 표시).
import { type Img, img } from './themes'

export type PostKind = '여행 후기' | '코스 공유' | '질문'

export type Post = {
  id: string
  kind: PostKind
  author: string
  /** 동행 횟수(글쓴이 옆) */
  trips: number
  when: string
  title: string
  summary: string
  body?: string
  photos: Img[]
  /** 체크인으로 받은 스탬프 */
  stamp?: string
  facts?: string[]
  themeId?: string
  coursePlace?: string
}

export const posts: Post[] = [
  {
    id: 'dumulmeori-quiet',
    kind: '여행 후기',
    author: '유나',
    trips: 3,
    when: '11월 8일 방문',
    title: '두물머리, 생각보다 훨씬 조용했어요',
    summary: '오전 10시쯤 도착하니 사람이 적어서 천천히 걸을 수 있었어요. 카페는 강변 쪽으로 바꿨어요.',
    body: '오전 10시쯤 도착하니 사람이 적어서 천천히 걸을 수 있었어요. 카페는 강변 쪽으로 바꿨는데 창가 자리가 넓어서 좋았어요.',
    photos: [img.dumulmeori, img.boat, img.cafe],
    stamp: '두물머리',
    facts: ['대중교통', '3곳 · 4시간', '실제 지출 1.6만원'],
    themeId: 'dumulmeori-sunset',
    coursePlace: 'dumulmeori',
  },
  {
    id: 'jinjeop-half-day',
    kind: '코스 공유',
    author: '서연',
    trips: 4,
    when: '11월 1일 방문',
    title: '진접 숲길과 절, 반나절 코스',
    summary: '숲길 70분, 봉선사 60분, 한정식. 오르막이 거의 없어서 처음 오는 분들도 편해요.',
    photos: [],
    themeId: 'gwangneung-morning',
    coursePlace: 'gwangneung',
  },
  {
    id: 'unkilsan-question',
    kind: '질문',
    author: '도현',
    trips: 0,
    when: '어제',
    title: '운길산역에서 수종사까지 얼마나 걸리나요?',
    summary: '오르막이 꽤 있다고 들었는데 운동화로 충분할까요?',
    photos: [],
  },
]

export const postById = (id: string) => posts.find((p) => p.id === id)
