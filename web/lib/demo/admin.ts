// 시연 데이터 — 운영팀 화면(그룹 A)
import type { BadgeTone } from '@/components/ui/primitives'

export type AdminItem = {
  id: string
  name: string
  line: string
  badge: [BadgeTone, string]
  /** 처리 버튼(검정 · 테두리). 하나뿐이면 테두리 버튼 하나 */
  actions: [string, string] | [string]
  /** 눌렀을 때 바뀌는 배지 [검정 버튼, 테두리 버튼] */
  after?: [[BadgeTone, string], [BadgeTone, string]]
  href?: string
}

export const hostChecks: AdminItem[] = [
  {
    id: 'supgil',
    name: '숲길 밥상',
    line: '가게 · 진접읍 · 11.20 제출',
    badge: ['warn', '확인 대기'],
    actions: ['확인 완료', '보류'],
    after: [
      ['ink', '사업장 확인'],
      ['muted', '보류'],
    ],
  },
  {
    id: 'harin',
    name: '하린',
    line: '주민 · 진접읍 · 11.19 제출',
    badge: ['warn', '확인 대기'],
    actions: ['확인 완료', '보류'],
    after: [
      ['ink', '주민 인증'],
      ['muted', '보류'],
    ],
  },
  {
    id: 'dasan',
    name: '다산 한정식',
    line: '가게 · 조안면',
    badge: ['ink', '사업장 확인'],
    actions: ['테마 4개 보기'],
    href: '/hosts/dasan',
  },
]

export const reportChecks: AdminItem[] = [
  {
    id: 'minjae',
    name: '민재',
    line: '약속 시간 불참 · 11.9 접수 · 체크인 기록 없음',
    badge: ['warn', '검토 중'],
    actions: ['불참 확인', '반려'],
    after: [
      ['soft', '처리 완료'],
      ['muted', '반려'],
    ],
  },
  {
    id: 'junho',
    name: '준호',
    line: '불쾌한 말이나 행동 · 11.3 접수',
    badge: ['soft', '처리 완료'],
    actions: ['기록 보기'],
    href: '/my/blocks',
  },
]
