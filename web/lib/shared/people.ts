// 사람·호스트 모양과 호스트 등록 종류 — 화면 부품이 같이 쓰는 타입(서버·브라우저 공용).
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

/** 호스트 등록 종류(가게·관광지 / 주민) */
export const hostKinds = [
  { id: 'business', title: '가게·관광지', sub: '사업장 확인', href: '/host/join' },
  { id: 'resident', title: '남양주 주민', sub: '주민 인증', href: '/host/join/resident' },
] as const
