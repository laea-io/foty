// 시연 데이터 — 호스트 쪽(내가 호스트 "다산 한정식"일 때).
import { hostById } from './people'
import { themeById } from './themes'

function must<T>(v: T | undefined, what: string): T {
  if (!v) throw new Error(`시연 데이터에 ${what}이(가) 없어요`)
  return v
}

export const myHost = must(hostById('dasan'), 'dasan')

export const hostKinds = [
  { id: 'business', title: '가게·관광지', sub: '사업장 확인', href: '/host/join' },
  { id: 'resident', title: '남양주 주민', sub: '주민 인증', href: '/host/join/resident' },
] as const

/** 테마 요청(참여자가 남긴 "이런 테마가 있으면 가고 싶어요"). 요청한 사람은 보이지 않는다 */
export const themeRequests = [
  {
    id: 'tofu',
    text: '두부 요리 잘하는 집에서 점심 먹고 가볍게 걷는 코스요.',
    when: '다음 주말',
    tags: ['맛집', '산책'],
    same: 3,
  },
  {
    id: 'quiet-tea',
    text: '아이 없이 조용히 차 마실 수 있는 곳이 있으면 좋겠어요.',
    when: '평일도 좋아요',
    tags: ['카페'],
    same: 2,
  },
  {
    id: 'sunset-dinner',
    text: '해 질 녘 강변에서 사진 찍고 저녁 먹는 테마요.',
    when: '이번 주말',
    tags: ['사진', '맛집'],
    same: 1,
  },
  {
    id: 'river-walk',
    text: '강변 따라 천천히 걷고 카페에서 쉬는 코스요.',
    when: '다음 주말',
    tags: ['산책', '카페'],
    same: 1,
  },
  {
    id: 'local-table',
    text: '동네 사람만 아는 밥집에서 점심 먹고 싶어요.',
    when: '언제든',
    tags: ['맛집'],
    same: 1,
  },
]

/** 호스트 화면의 내 테마들 */
export const hostThemes = {
  recruiting: must(themeById('dasan-lunch'), 'dasan-lunch'),
  matched: must(themeById('byeollae-drip'), 'byeollae-drip'),
}

/** 지난 테마(다산 한정식) — 방문은 체크인으로만 센다 */
export const pastThemes = [
  {
    id: 'p1',
    title: '한정식 점심과 여유당 산책',
    when: '11.14 (토) 11:30',
    status: '여행 완료' as const,
    note: '4명 방문 · 그중 첫 남양주 방문 3명',
    visitors: 4,
    cap: '6명 중',
  },
  {
    id: 'p2',
    title: '평일 저녁 한 상',
    when: '11.11 (수) 18:00',
    status: '취소' as const,
    note: '최소 3명 중 2명 신청 · 자동 취소됐어요',
    visitors: 0,
    cap: '최소 3명',
  },
  {
    id: 'p3',
    title: '한정식 점심과 여유당 산책',
    when: '11.7 (토) 11:30',
    status: '여행 완료' as const,
    note: '6명 방문 · 그중 첫 남양주 방문 4명',
    visitors: 6,
    cap: '6명 중',
  },
  {
    id: 'p4',
    title: '한정식 점심과 두물머리',
    when: '11.1 (일) 11:30',
    status: '여행 완료' as const,
    note: '5명 방문 · 그중 첫 남양주 방문 4명',
    visitors: 5,
    cap: '6명 중',
  },
]

/** 이번 달 방문 요약(시연 숫자) */
export const hostStats = [
  { value: '18', unit: '명', label: '내 테마로 온 방문객' },
  { value: '11', unit: '명', label: '남양주 첫 방문' },
  { value: '4 / 6', unit: '', label: '성사된 테마' },
  { value: '5', unit: '곳', label: '테마당 방문 장소 평균' },
]

/** 신청자(신청 현황) */
export const applicants = [
  {
    id: 'kanghyun',
    name: '강현',
    status: '신청 대기' as const,
    from: '상봉·중랑 출발 · 혼자 신청',
    tags: ['첫 동행이에요'],
    note: '남양주는 처음이에요. 천천히 걷는 코스면 좋겠어요.',
  },
  {
    id: 'yuna',
    name: '유나',
    status: '수락' as const,
    from: '상봉·중랑 출발 · 동행 3회',
    tags: ['서로를 배려해요'],
  },
  {
    id: 'dohyun',
    name: '도현',
    status: '수락' as const,
    from: '구리 출발 · 친구와 함께 +1',
    tags: ['첫 동행이에요'],
  },
]
