// 시연 세계 만들기 — 디자인 캔버스의 예시를 실제 DB 상태로 옮긴다.
// 날짜는 seed를 돌린 날 기준: "이번 주말" = 마감(전날 18:00)이 아직 남은 가장 가까운 토·일.
// 운영 DB에는 넣지 않는다(시연 계정 demo=true). 스테이징·개발·시험에서만.
import { eq, sql } from 'drizzle-orm'
import type { AnyDb } from '@/lib/server/domain/types'
import { hashPassword } from '@/lib/server/password'
import { bookableSaturday } from '@/lib/server/time'
import * as s from './schema'

export const DEMO_PASSWORD = 'foty-demo'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split('-').map(Number)
  return iso(new Date(Date.UTC(y, m - 1, d + n)))
}
const at = (day: string, hm: string) => new Date(`${day}T${hm}:00+09:00`)

/** 마감(금 18:00)이 지나지 않은 가장 가까운 토요일 — 홈의 "이번 주말"과 같은 규칙 */
export const demoSaturday = bookableSaturday

// ── 사람 ─────────────────────────────────────────────
const people = [
  {
    handle: 'kanghyun',
    name: '강현',
    origin: '상봉·중랑',
    mbti: 'INFP',
    mbtiPublic: true,
    prefs: {
      activities: ['산책', '카페', '사진'],
      pace: '여유롭게',
      talk: '상황에 따라',
      plan: '유연하게 조정하기',
    },
  },
  {
    handle: 'yuna',
    name: '유나',
    origin: '상봉·중랑',
    prefs: { activities: ['산책', '사진'], pace: '여유롭게', talk: '조용한 편' },
  },
  { handle: 'jiho', name: '지호', origin: '구리', prefs: { activities: ['자연', '카페'], pace: '알차게' } },
  { handle: 'dohyun', name: '도현', origin: '청량리', prefs: { activities: ['맛집'], pace: '적당히' } },
  {
    handle: 'harin',
    name: '하린',
    origin: '진접',
    prefs: { activities: ['자연', '산책'], pace: '여유롭게' },
  },
  { handle: 'minjae', name: '민재', origin: '잠실', prefs: { activities: ['카페'], talk: '활발한 편' } },
  {
    handle: 'junho',
    name: '준호',
    origin: '상봉·중랑',
    prefs: { activities: ['맛집', '산책'], pace: '적당히' },
  },
  {
    handle: 'seoyeon',
    name: '서연',
    origin: '덕소',
    prefs: { activities: ['사진', '산책'], talk: '조용한 편' },
  },
  { handle: 'dasan-owner', name: '다산 한정식', origin: '조안', prefs: {} },
  { handle: 'byeollae-owner', name: '별내 로스터리', origin: '별내', prefs: {} },
  { handle: 'supgil-owner', name: '숲길 밥상', origin: '진접', prefs: {} },
  { handle: 'unkil-owner', name: '운길산 찻집', origin: '조안', prefs: {} },
  { handle: 'sujin', name: '수진', origin: '진접', prefs: {} },
  { handle: 'admin', name: '운영팀', origin: '', prefs: {}, role: 'admin' as const },
]

const hosts = [
  {
    id: 'dasan',
    user: 'dasan-owner',
    kind: 'business' as const,
    name: '다산 한정식',
    area: '조안면',
    confirmMode: 'manual' as const,
    intro: '토요일 점심에 여섯 분 자리를 비워 둘게요. 식사 전후로 여유당과 두물머리를 걷는 코스를 붙였어요.',
    contact: '카카오톡 채널',
  },
  {
    id: 'byeollae',
    user: 'byeollae-owner',
    kind: 'business' as const,
    name: '별내 로스터리',
    area: '별내동',
    confirmMode: 'auto' as const,
    intro: '로스팅실에서 원두를 고르고 직접 내려 마셔요. 처음이어도 괜찮아요.',
    contact: '전화',
  },
  {
    id: 'supgil',
    user: 'supgil-owner',
    kind: 'business' as const,
    name: '숲길 밥상',
    area: '진접읍',
    confirmMode: 'auto' as const,
    intro: '봉선사 앞에서 제철 나물로 상을 차려요.',
    contact: '카카오톡 채널',
  },
  {
    id: 'jiho',
    user: 'jiho',
    kind: 'resident' as const,
    name: '지호',
    area: '조안면',
    confirmMode: 'auto' as const,
    intro: '운길산역 근처에 살아요. 수종사 찻집 창가 자리를 좋아해요.',
    contact: '',
  },
  {
    id: 'seoyeon',
    user: 'seoyeon',
    kind: 'resident' as const,
    name: '서연',
    area: '양서면',
    confirmMode: 'manual' as const,
    intro: '두물머리에서 해 질 녘 사진을 찍는 걸 좋아해요. 카메라 없어도 휴대폰이면 충분해요.',
    contact: '',
  },
  {
    id: 'harin',
    user: 'harin',
    kind: 'resident' as const,
    name: '하린',
    area: '진접읍',
    confirmMode: 'manual' as const,
    intro: '광릉숲 근처에서 10년째 살고 있어요. 아침 숲 공기를 같이 느껴 봐요.',
    contact: '',
  },
]
const pendingHosts = [
  {
    id: 'unkil',
    user: 'unkil-owner',
    kind: 'business' as const,
    name: '운길산 찻집',
    area: '조안면',
    intro: '운길산역 앞 작은 찻집이에요.',
  },
  {
    id: 'sujin',
    user: 'sujin',
    kind: 'resident' as const,
    name: '수진',
    area: '진접읍',
    intro: '진접 토박이예요.',
  },
]

// ── 장소(검토된 샘플) ────────────────────────────────
const IMG = {
  hanjeongsik: ['/images/hanjeongsik.jpg', '한정식', '#e9e3d6'],
  forest: ['/images/gwangneung-forest.jpg', '광릉숲 전나무길', '#dfe4dc'],
  trail: ['/images/gwangneung-trail.jpg', '광릉숲 관찰로', '#dfe4dc'],
  dumulmeori: ['/images/dumulmeori.jpg', '두물머리', '#dde3e6'],
  boat: ['/images/dumulmeori-boat.jpg', '두물머리 황포돛배', '#dde3e6'],
  sujongsa: ['/images/sujongsa.jpg', '수종사', '#e8e1dc'],
  bongseonsa: ['/images/bongseonsa.jpg', '봉선사', '#e8e1dc'],
  yeoyudang: ['/images/yeoyudang.jpg', '다산 유적지 여유당', '#e2e1e6'],
  cafe: ['/images/cafe.jpg', '카페', '#e6e1d8'],
  byeollae: ['/images/byeollae-cafe.jpg', '별내 카페거리', '#e6e1d8'],
} as const
type P = [
  id: string,
  name: string,
  short: string | null,
  area: string,
  kind: string,
  group: string,
  region: string | null,
  checked: string | null,
  img: keyof typeof IMG,
  opts?: { indoor?: boolean; cost?: number; stamp?: boolean },
]
const placeRows: P[] = [
  [
    'dasan-hanjeongsik',
    '다산 한정식',
    null,
    '조안면',
    '점심',
    '맛집',
    'dasan',
    '11-18',
    'hanjeongsik',
    { indoor: true, cost: 25000, stamp: true },
  ],
  [
    'yeoyudang',
    '다산 유적지 여유당',
    '여유당',
    '조안면',
    '문화 공간',
    '문화 공간',
    'dasan',
    '11-17',
    'yeoyudang',
    { stamp: true },
  ],
  [
    'silhak',
    '실학박물관',
    null,
    '조안면',
    '문화 공간',
    '문화 공간',
    'dasan',
    '11-17',
    'yeoyudang',
    { indoor: true, cost: 0, stamp: true },
  ],
  [
    'dumulmeori',
    '두물머리',
    null,
    '양서면',
    '산책',
    '자연',
    'paldang',
    '11-15',
    'dumulmeori',
    { stamp: true },
  ],
  [
    'dumulmeori-walk',
    '두물머리 산책',
    '두물머리',
    '양서면',
    '산책',
    '자연',
    'paldang',
    '11-15',
    'dumulmeori',
  ],
  [
    'water-garden',
    '물의정원',
    null,
    '조안면',
    '산책',
    '자연',
    'paldang',
    '11-15',
    'dumulmeori',
    { stamp: true },
  ],
  [
    'paldang-view',
    '팔당 전망대',
    null,
    '조안면',
    '전망',
    '자연',
    'paldang',
    '11-12',
    'dumulmeori',
    { stamp: true },
  ],
  [
    'riverside-cafe',
    '강변 카페',
    '카페',
    '조안면',
    '카페',
    '카페',
    'paldang',
    null,
    'cafe',
    { indoor: true, cost: 9000 },
  ],
  [
    'rooftop-cafe',
    '덕소 루프탑 카페',
    null,
    '와부읍',
    '카페',
    '카페',
    'paldang',
    '11-19',
    'byeollae',
    { indoor: true, cost: 8000 },
  ],
  [
    'tea-house',
    '강가 찻집',
    '찻집',
    '양서면',
    '카페',
    '카페',
    'paldang',
    null,
    'cafe',
    { indoor: true, cost: 7000 },
  ],
  ['unkilsan-st', '운길산역', null, '조안면', '집결', '기타', null, '11-17', 'sujongsa'],
  [
    'sujongsa',
    '수종사',
    null,
    '조안면',
    '문화·자연',
    '문화 공간',
    'paldang',
    '11-15',
    'sujongsa',
    { stamp: true },
  ],
  [
    'gwangneung',
    '광릉숲 전나무길',
    '광릉숲',
    '진접읍',
    '산책',
    '자연',
    'gwangneung',
    '11-15',
    'forest',
    { stamp: true },
  ],
  ['gwangneung-trail', '광릉숲 관찰로', '광릉숲', '진접읍', '산책', '자연', 'gwangneung', '11-15', 'trail'],
  [
    'bongseonsa',
    '봉선사',
    null,
    '진접읍',
    '문화·자연',
    '문화 공간',
    'gwangneung',
    '11-15',
    'bongseonsa',
    { stamp: true },
  ],
  [
    'supgil',
    '숲길 밥상',
    null,
    '진접읍',
    '점심',
    '맛집',
    'gwangneung',
    '11-18',
    'hanjeongsik',
    { indoor: true, cost: 15000, stamp: true },
  ],
  [
    'tofu-house',
    '두부 전문점',
    null,
    '진접읍',
    '점심',
    '맛집',
    'gwangneung',
    '11-18',
    'hanjeongsik',
    { indoor: true, cost: 12000 },
  ],
  [
    'temple-food',
    '사찰음식',
    null,
    '진접읍',
    '사찰음식',
    '맛집',
    'gwangneung',
    '11-18',
    'hanjeongsik',
    { indoor: true, cost: 20000 },
  ],
  ['byeollae-walk', '별내 산책길', null, '별내동', '산책', '자연', 'byeollae', '11-16', 'byeollae'],
  [
    'byeollae-roastery',
    '별내 로스터리',
    '로스터리',
    '별내동',
    '체험',
    '카페',
    'byeollae',
    '11-18',
    'cafe',
    { indoor: true, cost: 18000, stamp: true },
  ],
  [
    'bakery',
    '동네 빵집',
    '빵집',
    '별내동',
    '빵집',
    '카페',
    'byeollae',
    null,
    'byeollae',
    { indoor: true, cost: 6000 },
  ],
]

// ── 테마 ─────────────────────────────────────────────
type Stop = [place: string, time: string, stay: number, next?: string, fixed?: boolean]
type T = {
  id: string
  host: string
  core: string
  title: string
  day: string
  start: string
  end: string
  min: number
  max: number
  travel: number
  cost: number
  status: (typeof s.themeStatus.enumValues)[number]
  activities: string[]
  meet: string
  include: string
  exclude: string
  stops: Stop[]
  /** handle → [상태, 인원] */
  apps: Record<string, [(typeof s.applicationStatus.enumValues)[number], number?]>
  checkins?: string[]
  meetDetail?: string
  cancelReason?: string
}

function themesFor(sat: string): T[] {
  const sun = addDays(sat, 1)
  const dasanStops: Stop[] = [
    ['yeoyudang', '10:20', 50, '도보 8분'],
    ['dasan-hanjeongsik', '11:30', 80, '버스 12분', true],
    ['dumulmeori-walk', '13:20', 60, '도보 5분'],
    ['riverside-cafe', '14:30', 50],
  ]
  const base = {
    meet: '상봉역 1번 출구에서 모여 함께 이동해요. 상세 위치는 성사 후 공개돼요.',
    exclude: '교통비 · 현장에서 각자 결제',
  }
  const dasan = (id: string, day: string, status: T['status'], apps: T['apps'], checkins?: string[]): T => ({
    id,
    host: 'dasan',
    core: 'dasan-hanjeongsik',
    title: '한정식 점심과 여유당 산책',
    day,
    start: '11:30',
    end: '15:30',
    min: 3,
    max: 6,
    travel: 45,
    cost: 25000,
    status,
    activities: ['맛집', '산책'],
    ...base,
    include: '한정식 1인 상차림',
    exclude: '교통비, 카페 음료 · 현장에서 각자 결제',
    stops: dasanStops,
    apps,
    checkins,
  })
  return [
    // 이번 주말
    dasan('dasan-lunch', sat, '모집 중', { yuna: ['수락'], dohyun: ['수락'], kanghyun: ['신청 대기'] }),
    {
      id: 'byeollae-drip',
      host: 'byeollae',
      core: 'byeollae-roastery',
      title: '로스터리에서 배우는 핸드드립',
      day: sat,
      start: '14:00',
      end: '17:00',
      min: 3,
      max: 5,
      travel: 25,
      cost: 18000,
      status: '일정 확정',
      activities: ['카페'],
      meet: '별내역 2번 출구에서 모여요.',
      meetDetail: '13:20 · 상봉역 1번 출구',
      include: '핸드드립 체험, 원두 100g',
      exclude: '교통비, 빵 · 현장에서 각자 결제',
      stops: [
        ['byeollae-walk', '13:20', 30, '도보 6분'],
        ['byeollae-roastery', '14:00', 90, '도보 4분', true],
        ['bakery', '15:40', 30],
      ],
      apps: { yuna: ['수락'], jiho: ['수락'], kanghyun: ['수락'] },
    },
    {
      id: 'sujongsa-tea',
      host: 'jiho',
      core: 'sujongsa',
      title: '수종사 찻집에서 보는 두물머리',
      day: sat,
      start: '10:30',
      end: '14:30',
      min: 3,
      max: 4,
      travel: 50,
      cost: 15000,
      status: '모집 마감',
      activities: ['자연', '카페'],
      meet: '운길산역 1번 출구에서 모여요.',
      include: '찻값',
      exclude: '교통비, 점심 · 현장에서 각자 결제',
      stops: [
        ['unkilsan-st', '10:30', 10, '도보 50분'],
        ['sujongsa', '11:30', 90, '버스 15분', true],
        ['dumulmeori', '13:30', 60],
      ],
      apps: { seoyeon: ['수락'], junho: ['수락'], minjae: ['수락'], dohyun: ['수락'] },
    },
    {
      id: 'dumulmeori-sunset',
      host: 'seoyeon',
      core: 'dumulmeori',
      title: '두물머리 해 질 녘 사진 산책',
      day: sat,
      start: '16:00',
      end: '19:00',
      min: 3,
      max: 6,
      travel: 40,
      cost: 10000,
      status: '모집 중',
      activities: ['사진', '산책'],
      meet: '양수역 1번 출구에서 모여요.',
      include: '없음',
      exclude: '교통비, 찻값 · 현장에서 각자 결제',
      stops: [
        ['water-garden', '15:20', 30, '버스 10분'],
        ['dumulmeori', '16:00', 90, '도보 5분', true],
        ['tea-house', '17:40', 50],
      ],
      apps: { junho: ['수락'], kanghyun: ['신청 대기'] },
    },
    {
      id: 'gwangneung-morning',
      host: 'harin',
      core: 'gwangneung',
      title: '광릉숲 전나무길 아침 산책',
      day: sun,
      start: '09:30',
      end: '13:50',
      min: 3,
      max: 6,
      travel: 55,
      cost: 15000,
      status: '일정 조율 중',
      activities: ['자연', '산책'],
      meet: '상봉역 1번 출구에서 모여 함께 이동해요.',
      meetDetail: '08:40 · 상봉역 1번 출구',
      include: '없음',
      exclude: '교통비, 점심 · 현장에서 각자 결제',
      stops: [
        ['gwangneung', '09:30', 90, '도보 15분', true],
        ['bongseonsa', '11:20', 50, '버스 10분'],
        ['supgil', '12:40', 70],
      ],
      apps: { yuna: ['수락'], jiho: ['수락'], dohyun: ['수락'], kanghyun: ['수락'] },
    },
    {
      id: 'bongseonsa-temple',
      host: 'supgil',
      core: 'bongseonsa',
      title: '봉선사 연등길과 사찰음식 한 끼',
      day: sun,
      start: '11:00',
      end: '15:00',
      min: 3,
      max: 5,
      travel: 55,
      cost: 20000,
      status: '모집 중',
      activities: ['문화 공간', '맛집'],
      meet: '상봉역 2번 출구에서 모여요.',
      include: '사찰음식 한 상',
      exclude: '교통비 · 현장에서 각자 결제',
      stops: [
        ['gwangneung-trail', '10:00', 50, '도보 15분'],
        ['bongseonsa', '11:00', 60, '도보 5분', true],
        ['temple-food', '12:10', 70],
      ],
      apps: { minjae: ['수락'], junho: ['수락'] },
    },
    // 지난 테마(방문 기록 · 스탬프 · 호스트 방문 요약)
    dasan(
      'dasan-lunch-1114',
      addDays(sat, -7),
      '여행 완료',
      { kanghyun: ['수락'], yuna: ['수락'], junho: ['수락'], minjae: ['수락'] },
      ['kanghyun', 'yuna', 'junho', 'minjae'],
    ),
    dasan(
      'dasan-lunch-1107',
      addDays(sat, -14),
      '여행 완료',
      { yuna: ['수락', 2], dohyun: ['수락', 2], junho: ['수락'], minjae: ['수락'] },
      ['yuna', 'dohyun', 'junho', 'minjae'],
    ),
    {
      ...dasan('dasan-dinner-1111', addDays(sat, -10), '취소', {
        junho: ['신청 취소'],
        minjae: ['신청 취소'],
      }),
      title: '평일 저녁 한 상',
      start: '18:00',
      end: '20:30',
      cancelReason: '최소 인원 미달',
    },
    {
      ...dasan(
        'dasan-lunch-1101',
        addDays(sat, -20),
        '여행 완료',
        { seoyeon: ['수락'], jiho: ['수락'], junho: ['수락'], minjae: ['수락'], dohyun: ['수락'] },
        ['seoyeon', 'jiho', 'junho', 'minjae', 'dohyun'],
      ),
      title: '한정식 점심과 두물머리',
    },
    {
      id: 'dumulmeori-sunset-1108',
      host: 'seoyeon',
      core: 'dumulmeori',
      title: '두물머리 해 질 녘 사진 산책',
      day: addDays(sat, -13),
      start: '16:00',
      end: '19:00',
      min: 3,
      max: 6,
      travel: 40,
      cost: 10000,
      status: '여행 완료',
      activities: ['사진', '산책'],
      meet: '양수역 1번 출구에서 모여요.',
      include: '없음',
      exclude: '교통비, 찻값 · 현장에서 각자 결제',
      stops: [
        ['water-garden', '15:20', 30, '버스 10분'],
        ['dumulmeori', '16:00', 90, '도보 5분', true],
        ['riverside-cafe', '17:40', 50],
      ],
      apps: { kanghyun: ['수락'], yuna: ['수락'], junho: ['수락'] },
      checkins: ['kanghyun', 'yuna', 'junho'],
    },
    {
      id: 'dumulmeori-morning-1011',
      host: 'seoyeon',
      core: 'dumulmeori',
      title: '두물머리 아침 산책과 찻집',
      day: addDays(sat, -41),
      start: '09:00',
      end: '12:00',
      min: 3,
      max: 6,
      travel: 40,
      cost: 8000,
      status: '여행 완료',
      activities: ['산책'],
      meet: '양수역 1번 출구에서 모여요.',
      include: '없음',
      exclude: '교통비 · 현장에서 각자 결제',
      stops: [
        ['dumulmeori', '09:00', 90, '도보 5분', true],
        ['tea-house', '10:40', 50],
      ],
      apps: { kanghyun: ['수락'], jiho: ['수락'], dohyun: ['수락'] },
      checkins: ['kanghyun', 'jiho', 'dohyun'],
    },
    {
      id: 'sujongsa-tea-1025',
      host: 'jiho',
      core: 'sujongsa',
      title: '수종사 찻집에서 보는 두물머리',
      day: addDays(sat, -27),
      start: '10:30',
      end: '14:30',
      min: 3,
      max: 4,
      travel: 50,
      cost: 15000,
      status: '여행 완료',
      activities: ['자연', '카페'],
      meet: '운길산역 1번 출구에서 모여요.',
      include: '찻값',
      exclude: '교통비, 점심 · 현장에서 각자 결제',
      stops: [
        ['unkilsan-st', '10:30', 10, '도보 50분'],
        ['sujongsa', '11:30', 90, '버스 15분', true],
        ['dumulmeori', '13:30', 60],
      ],
      apps: { kanghyun: ['수락'], seoyeon: ['수락'], yuna: ['수락'] },
      checkins: ['kanghyun', 'seoyeon', 'yuna'],
    },
    {
      id: 'bongseonsa-temple-1115',
      host: 'supgil',
      core: 'bongseonsa',
      title: '봉선사 연등길과 사찰음식 한 끼',
      day: addDays(sat, -6),
      start: '11:00',
      end: '15:00',
      min: 3,
      max: 5,
      travel: 55,
      cost: 20000,
      status: '취소',
      activities: ['문화 공간', '맛집'],
      meet: '상봉역 2번 출구에서 모여요.',
      include: '사찰음식 한 상',
      exclude: '교통비 · 현장에서 각자 결제',
      stops: [
        ['gwangneung-trail', '10:00', 50, '도보 15분'],
        ['bongseonsa', '11:00', 60, '도보 5분', true],
        ['temple-food', '12:10', 70],
      ],
      apps: { kanghyun: ['수락'], minjae: ['수락'] },
      cancelReason: '최소 인원 미달',
    },
    {
      id: 'gwangneung-morning-1109',
      host: 'harin',
      core: 'gwangneung',
      title: '광릉숲 전나무길 아침 산책',
      day: addDays(sat, -12),
      start: '09:30',
      end: '13:50',
      min: 3,
      max: 6,
      travel: 55,
      cost: 15000,
      status: '여행 완료',
      activities: ['자연', '산책'],
      meet: '상봉역 1번 출구에서 모여 함께 이동해요.',
      include: '없음',
      exclude: '교통비, 점심 · 현장에서 각자 결제',
      stops: [
        ['gwangneung', '09:30', 90, '도보 15분', true],
        ['bongseonsa', '11:20', 50, '버스 10분'],
        ['supgil', '12:40', 70],
      ],
      apps: { kanghyun: ['수락'], minjae: ['수락'], junho: ['수락'] },
      checkins: ['junho'],
    },
  ]
}

/** 비어 있는 DB에 시연 세계를 넣는다. 이미 있으면 건너뛴다(force면 지우고 다시) */
export async function seedDemo(db: AnyDb, opts: { now?: Date; force?: boolean } = {}) {
  const now = opts.now ?? new Date()
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.users)
  if (Number(n) > 0 && !opts.force) return { skipped: true as const }
  if (opts.force) {
    await db.execute(sql`truncate table ${s.users}, ${s.places}, ${s.themeRequests} restart identity cascade`)
  }
  const sat = demoSaturday(now)
  const yr = sat.slice(0, 4)
  const pw = await hashPassword(DEMO_PASSWORD)

  // 사람
  const userRows = await db
    .insert(s.users)
    .values(
      people.map((p) => ({
        handle: p.handle,
        name: p.name,
        email: `${p.handle}@demo.foty.kr`,
        passwordHash: pw,
        role: 'role' in p && p.role ? p.role : ('user' as const),
        adult: true,
        origin: p.origin || null,
        mbti: 'mbti' in p ? p.mbti : null,
        mbtiPublic: 'mbtiPublic' in p ? !!p.mbtiPublic : false,
        prefs: p.prefs,
        privacy: { profilePublic: true, tripsPublic: true, photosPublic: false },
        onboarded: true,
        demo: true,
      })),
    )
    .returning()
  const uid = (h: string) => {
    const u = userRows.find((x) => x.handle === h)
    if (!u) throw new Error(`seed: ${h}`)
    return u.id
  }

  await db.insert(s.hosts).values([
    ...hosts.map((h) => ({
      id: h.id,
      userId: uid(h.user),
      kind: h.kind,
      name: h.name,
      area: h.area,
      intro: h.intro,
      contact: h.contact,
      status: '확인 완료' as const,
      confirmMode: h.confirmMode,
      verifiedAt: at(addDays(sat, -30), '10:00'),
      submittedAt: at(addDays(sat, -32), '10:00'),
    })),
    ...pendingHosts.map((h, i) => ({
      id: h.id,
      userId: uid(h.user),
      kind: h.kind,
      name: h.name,
      area: h.area,
      intro: h.intro,
      submittedAt: at(addDays(sat, -2 - i), '10:00'),
    })),
  ])

  await db.insert(s.places).values(
    placeRows.map(([id, name, short, area, kind, group, region, checked, im, o]) => ({
      id,
      name,
      short,
      area,
      kind,
      group,
      region,
      checkedOn: checked ? `${yr}-${checked}` : null,
      sourceUrl: 'https://www.nyj.go.kr/',
      image: IMG[im][0],
      imageAlt: IMG[im][1],
      imageBg: IMG[im][2],
      indoor: o?.indoor ?? false,
      cost: o?.cost ?? 0,
      stamp: o?.stamp ?? false,
    })),
  )

  // 테마 · 코스 · 신청 · 체크인
  for (const t of themesFor(sat)) {
    await db.insert(s.themes).values({
      id: t.id,
      hostId: t.host,
      corePlaceId: t.core,
      title: t.title,
      day: t.day,
      start: t.start,
      end: t.end,
      min: t.min,
      max: t.max,
      deadline: at(addDays(t.day, -1), '18:00'),
      travelMin: t.travel,
      costWon: t.cost,
      meet: t.meet,
      include: t.include,
      exclude: t.exclude,
      activities: t.activities,
      status: t.status,
      confirmMode: hosts.find((h) => h.id === t.host)?.confirmMode ?? 'auto',
      meetDetail: t.meetDetail ?? '',
      cancelReason: t.cancelReason ?? null,
      scheduleVersion: t.id === 'gwangneung-morning' ? 3 : 1,
      createdAt: at(addDays(t.day, -10), '09:00'),
    })
    await db.insert(s.themeStops).values(
      t.stops.map(([placeId, time, stayMin, next, fixed], ord) => ({
        themeId: t.id,
        ord,
        placeId,
        time,
        stayMin,
        next,
        fixed: !!fixed,
      })),
    )
    const apps = Object.entries(t.apps)
    if (apps.length)
      await db.insert(s.applications).values(
        apps.map(([h, [status, party]], i) => ({
          themeId: t.id,
          userId: uid(h),
          status,
          party: party ?? 1,
          message: h === 'kanghyun' ? '남양주는 처음이에요. 천천히 걷는 코스면 좋겠어요.' : '',
          createdAt: at(addDays(t.day, -6 + i), '20:00'),
          decidedAt: status === '신청 대기' ? null : at(addDays(t.day, -5 + i), '09:00'),
        })),
      )
    const fixedStop = t.stops.find((x) => x[4])
    for (const h of t.checkins ?? []) {
      await db.insert(s.checkins).values({
        themeId: t.id,
        userId: uid(h),
        placeId: t.core,
        method: 'qr',
        firstVisit: h === 'kanghyun' ? t.id === 'dumulmeori-morning-1011' : h === 'minjae',
        createdAt: at(t.day, fixedStop?.[1] ?? t.start),
      })
    }
    if (t.status === '여행 완료') {
      const done = new Set(t.checkins ?? [])
      const accepted = apps.filter(([, [st]]) => st === '수락').map(([h]) => h)
      if (accepted.length)
        await db.insert(s.attendance).values(
          accepted.map((h) => ({
            themeId: t.id,
            userId: uid(h),
            status: done.has(h) ? ('참여 확인' as const) : ('검토 중' as const),
          })),
        )
    }
  }

  // 그룹 공간: 대화 · 변경 제안(광릉숲)
  const g = 'gwangneung-morning'
  // 대화·변경은 지금 기준(미래 시각이 되지 않게)
  const t0 = new Date(now.getTime() - 3 * 3600000)
  await db.insert(s.messages).values([
    {
      themeId: g,
      userId: null,
      body: '최소 인원이 모여 테마가 성사됐어요. 집결과 일정을 함께 정해요.',
      createdAt: new Date(now.getTime() - 26 * 3600000),
    },
    {
      themeId: g,
      userId: uid('harin'),
      body: '안녕하세요! 이번 주 날씨 괜찮대요.\n집결은 상봉역 1번 출구 앞이에요.',
      createdAt: t0,
    },
    {
      themeId: g,
      userId: uid('yuna'),
      body: '점심은 코스에 있는 숲길 밥상으로 가는 거죠?',
      createdAt: new Date(t0.getTime() + 8 * 60000),
    },
    {
      themeId: g,
      userId: uid('kanghyun'),
      body: '네 좋아요! 8시 20분 집결 괜찮아요.',
      createdAt: new Date(t0.getTime() + 12 * 60000),
    },
  ])
  const [meet] = await db
    .insert(s.changes)
    .values({
      themeId: g,
      proposerId: uid('harin'),
      kind: 'meet_time',
      label: '집결 시간',
      fromText: '08:40',
      toText: '08:20',
      major: true,
      status: '변경 확인 중',
      payload: { meet: '08:20 · 상봉역 1번 출구' },
      createdAt: new Date(now.getTime() - 60 * 60000),
    })
    .returning()
  await db
    .insert(s.changeConfirms)
    .values(['harin', 'yuna', 'jiho'].map((h) => ({ changeId: meet.id, userId: uid(h) })))
  await db.insert(s.changes).values([
    {
      themeId: g,
      proposerId: uid('yuna'),
      kind: 'stop',
      label: '세 번째 장소',
      fromText: '숲길 밥상',
      toText: '두부 전문점',
      source: 'AI 대안',
      status: '제안됨',
      payload: { ord: 2, placeId: 'tofu-house' },
      createdAt: new Date(now.getTime() - 40 * 60000),
    },
    {
      themeId: g,
      proposerId: uid('harin'),
      kind: 'stop',
      label: '두 번째 장소',
      fromText: '국립수목원',
      toText: '봉선사',
      status: '반영됨',
      createdAt: new Date(now.getTime() - 30 * 3600000),
      decidedAt: new Date(now.getTime() - 29 * 3600000),
    },
  ])

  // 평가(동행 태그)
  const review = (theme: string, from: string, to: string, tags: string[]) => ({
    themeId: theme,
    fromUser: uid(from),
    toUser: uid(to),
    tags,
  })
  await db
    .insert(s.peerReviews)
    .values([
      review('dasan-lunch-1114', 'junho', 'yuna', ['서로를 배려해요', '시간을 잘 지켜요']),
      review('dasan-lunch-1114', 'minjae', 'yuna', ['서로를 배려해요']),
      review('dasan-lunch-1101', 'seoyeon', 'jiho', ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요']),
      review('dasan-lunch-1101', 'junho', 'jiho', ['시간을 잘 지켜요']),
      review('dumulmeori-sunset-1108', 'yuna', 'junho', ['시간을 잘 지켜요']),
      review('gwangneung-morning-1109', 'junho', 'harin', [
        '시간을 잘 지켜요',
        '변경 사항을 잘 알려줘요',
        '서로를 배려해요',
      ]),
      review('gwangneung-morning-1109', 'minjae', 'harin', ['시간을 잘 지켜요', '서로를 배려해요']),
      review('sujongsa-tea-1025', 'kanghyun', 'seoyeon', ['서로를 배려해요']),
    ])

  // 커뮤니티
  await db.insert(s.posts).values([
    {
      id: 'dumulmeori-quiet',
      kind: '여행 후기',
      authorId: uid('yuna'),
      themeId: 'dumulmeori-sunset-1108',
      placeId: 'dumulmeori',
      title: '두물머리, 생각보다 훨씬 조용했어요',
      body: '오전 10시쯤 도착하니 사람이 적어서 천천히 걸을 수 있었어요. 카페는 강변 쪽으로 바꿨는데 창가 자리가 넓어서 좋았어요.',
      photos: ['/images/dumulmeori.jpg', '/images/dumulmeori-boat.jpg', '/images/cafe.jpg'],
      transport: '대중교통',
      changedPlace: '카페는 강변 쪽으로 바꿨어요',
      spentWon: 16000,
      visitedOn: addDays(sat, -13),
      createdAt: at(addDays(sat, -12), '20:00'),
    },
    {
      id: 'jinjeop-half-day',
      kind: '코스 공유',
      authorId: uid('seoyeon'),
      themeId: 'gwangneung-morning-1109',
      placeId: 'gwangneung',
      title: '진접 숲길과 절, 반나절 코스',
      body: '숲길 70분, 봉선사 60분, 한정식. 오르막이 거의 없어서 처음 오는 분들도 편해요.',
      visitedOn: addDays(sat, -20),
      createdAt: at(addDays(sat, -19), '20:00'),
    },
    {
      id: 'unkilsan-question',
      kind: '질문',
      authorId: uid('dohyun'),
      placeId: 'sujongsa',
      title: '운길산역에서 수종사까지 얼마나 걸리나요?',
      body: '오르막이 꽤 있다고 들었는데 운동화로 충분할까요?',
      createdAt: new Date(now.getTime() - 26 * 3600000),
    },
  ])
  await db.insert(s.savedCourses).values([
    {
      userId: uid('kanghyun'),
      corePlaceId: 'dasan-hanjeongsik',
      title: '다산 한정식 코스',
      day: sat,
      stops: ['yeoyudang', 'dasan-hanjeongsik', 'dumulmeori-walk', 'riverside-cafe'],
    },
    {
      userId: uid('kanghyun'),
      corePlaceId: 'sujongsa',
      title: '수종사에서 두물머리까지',
      stops: ['unkilsan-st', 'sujongsa', 'dumulmeori'],
    },
    {
      userId: uid('kanghyun'),
      corePlaceId: 'gwangneung',
      title: '광릉숲과 봉선사, 반나절 코스',
      stops: ['gwangneung', 'bongseonsa', 'supgil'],
      fromPostId: 'jinjeop-half-day',
    },
  ])

  // 테마 요청
  await db.insert(s.themeRequests).values([
    {
      userId: uid('kanghyun'),
      body: '두부 요리 잘하는 집에서 점심 먹고 가볍게 걷는 코스요.',
      when: '다음 주말',
      tags: ['맛집', '산책'],
      same: 3,
    },
    {
      userId: uid('minjae'),
      body: '아이 없이 조용히 차 마실 수 있는 곳이 있으면 좋겠어요.',
      when: '평일도 좋아요',
      tags: ['카페'],
      same: 2,
    },
    {
      userId: uid('yuna'),
      body: '해 질 녘 강변에서 사진 찍고 저녁 먹는 테마요.',
      when: '이번 주말',
      tags: ['사진', '맛집'],
      same: 1,
    },
    {
      userId: uid('junho'),
      body: '강변 따라 천천히 걷고 카페에서 쉬는 코스요.',
      when: '다음 주말',
      tags: ['산책', '카페'],
      same: 1,
    },
    {
      userId: uid('dohyun'),
      body: '동네 사람만 아는 밥집에서 점심 먹고 싶어요.',
      when: '언제든',
      tags: ['맛집'],
      same: 1,
    },
  ])

  // 알림(강현)
  const ago = (h: number) => new Date(now.getTime() - h * 3600000)
  await db.insert(s.notifications).values([
    {
      userId: uid('kanghyun'),
      title: '테마가 성사됐어요',
      body: '광릉숲 전나무길 아침 산책 · 그룹 공간이 열렸어요',
      href: '/themes/gwangneung-morning/matched',
      createdAt: ago(0.1),
    },
    {
      userId: uid('kanghyun'),
      title: '집결 시간 변경 확인이 필요해요',
      body: '08:40 → 08:20 · 호스트 하린',
      href: '/trips/gwangneung-morning',
      createdAt: ago(1),
    },
    {
      userId: uid('kanghyun'),
      title: '스탬프를 받았어요',
      body: '두물머리 · 팔당·조안 수변',
      href: '/my/stamps',
      createdAt: ago(24 * 12),
      readAt: ago(24 * 11),
    },
    {
      userId: uid('kanghyun'),
      title: '신청이 수락됐어요',
      body: '로스터리에서 배우는 핸드드립',
      href: '/themes/byeollae-drip',
      createdAt: ago(26),
      readAt: ago(25),
    },
    {
      userId: uid('kanghyun'),
      title: '하린 님이 새 테마를 열었어요',
      body: '광릉숲 전나무길 아침 산책',
      href: '/hosts/harin',
      createdAt: ago(50),
      readAt: ago(49),
    },
  ])

  // 신고 · 차단
  await db.insert(s.reports).values([
    {
      reporterId: uid('harin'),
      targetUserId: uid('minjae'),
      reason: '약속 시간 불참',
      detail: '체크인 기록 없음',
      createdAt: ago(24 * 12),
    },
    {
      reporterId: uid('yuna'),
      targetUserId: uid('junho'),
      reason: '불쾌한 말이나 행동',
      status: '처리 완료',
      createdAt: ago(24 * 18),
      resolvedAt: ago(24 * 17),
    },
  ])
  await db.insert(s.subscriptions).values([{ userId: uid('kanghyun'), kind: 'host', key: 'harin' }])

  return { skipped: false as const, saturday: sat, users: userRows.length }
}

/** 시연 계정 하나 찾기(스테이징 "시연 계정으로 보기") */
export async function demoUser(db: AnyDb, handle: string) {
  const [u] = await db.select().from(s.users).where(eq(s.users.handle, handle))
  return u?.demo ? u : null
}
