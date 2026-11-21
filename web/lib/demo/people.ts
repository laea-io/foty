// 시연 데이터 — 사람. 실제 운영 데이터가 아니다(화면마다 "시연용 예시" 표시).

export type HostKind = 'business' | 'resident'

export type Host = {
  id: string
  name: string
  kind: HostKind
  /** 읍·면·동 */
  area: string
  /** 진행한 테마 수 */
  hosted: number
  intro: string
}

export type Person = {
  id: string
  name: string
  /** 출발 권역 */
  from: string
  /** 확인된 동행 횟수(0이면 "첫 동행이에요") */
  trips: number
  tags: string[]
  mbti?: string
}

export const me: Person = {
  id: 'kanghyun',
  name: '강현',
  from: '상봉·중랑',
  trips: 0,
  tags: [],
  mbti: 'INFP',
}

export const people: Person[] = [
  me,
  { id: 'yuna', name: '유나', from: '상봉·중랑', trips: 3, tags: ['서로를 배려해요', '시간을 잘 지켜요'] },
  { id: 'jiho', name: '지호', from: '구리', trips: 5, tags: ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요'] },
  { id: 'dohyun', name: '도현', from: '청량리', trips: 0, tags: [] },
  { id: 'harin', name: '하린', from: '진접', trips: 7, tags: ['서로를 배려해요'] },
  { id: 'minjae', name: '민재', from: '잠실', trips: 1, tags: [] },
  { id: 'junho', name: '준호', from: '상봉·중랑', trips: 2, tags: ['시간을 잘 지켜요'] },
  { id: 'seoyeon', name: '서연', from: '덕소', trips: 4, tags: ['서로를 배려해요'] },
]

export const hosts: Host[] = [
  {
    id: 'dasan',
    name: '다산 한정식',
    kind: 'business',
    area: '조안면',
    hosted: 4,
    intro: '토요일 점심에 여섯 분 자리를 비워 둘게요. 식사 전후로 여유당과 두물머리를 걷는 코스를 붙였어요.',
  },
  {
    id: 'byeollae',
    name: '별내 로스터리',
    kind: 'business',
    area: '별내동',
    hosted: 6,
    intro: '로스팅실에서 원두를 고르고 직접 내려 마셔요. 처음이어도 괜찮아요.',
  },
  {
    id: 'jiho',
    name: '지호',
    kind: 'resident',
    area: '조안면',
    hosted: 3,
    intro: '운길산역 근처에 살아요. 수종사 찻집 창가 자리를 좋아해요.',
  },
  {
    id: 'seoyeon',
    name: '서연',
    kind: 'resident',
    area: '양서면',
    hosted: 2,
    intro: '두물머리에서 해 질 녘 사진을 찍는 걸 좋아해요. 카메라 없어도 휴대폰이면 충분해요.',
  },
  {
    id: 'harin',
    name: '하린',
    kind: 'resident',
    area: '진접읍',
    hosted: 5,
    intro: '광릉숲 근처에서 10년째 살고 있어요. 아침 숲 공기를 같이 느껴 봐요.',
  },
  {
    id: 'supgil',
    name: '숲길 밥상',
    kind: 'business',
    area: '진접읍',
    hosted: 2,
    intro: '봉선사 앞에서 제철 나물로 상을 차려요.',
  },
]

export const hostById = (id: string) => hosts.find((h) => h.id === id)
export const personById = (id: string) => people.find((p) => p.id === id)
