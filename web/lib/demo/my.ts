// 시연 데이터 — 마이(그룹 A). 디자인의 숫자를 그대로 옮겼다.
import type { IconName } from '@/components/ui/icon'

export const myProfile = {
  name: '강현',
  line: '상봉역 출발 · 동행 3회',
  /** 모바일 카드 숫자 */
  mobileStats: [
    ['3회', '동행 기록'],
    ['2', '예정'],
    ['3', '스탬프'],
  ] as [string, string][],
  /** 데스크톱 카드 숫자 */
  desktopStats: [
    ['3회', '동행 기록'],
    ['1', '예정'],
    ['2', '신청 중'],
  ] as [string, string][],
  mobileTaste: ['산책', '카페', '사진', '여유롭게', '1~2시간 걷기'],
  desktopTaste: ['산책', '카페', '사진', '여유롭게', '상황에 따라', '유연하게 조정하기'],
}

export type MenuItem = { href: string; label: string; icon: IconName; aside?: string }

export const mobileMenu: MenuItem[] = [
  { href: '/notifications', label: '알림', icon: 'bell' },
  { href: '/host/join', label: '호스트 신청', icon: 'plus' },
  { href: '/my/privacy', label: '개인정보 공개 범위', icon: 'shield' },
  { href: '/my/blocks', label: '신고·차단 내역', icon: 'flag' },
  { href: '/login', label: '로그아웃', icon: 'logout' },
]

export const desktopMenu: MenuItem[] = [
  { href: '/my/privacy', label: '개인정보 공개 범위', icon: 'shield', aside: 'MBTI 비공개' },
  { href: '/notifications', label: '알림', icon: 'bell', aside: '새 테마 · 성사' },
  { href: '/my/blocks', label: '신고·차단 내역', icon: 'flag' },
  { href: '/host/join', label: '호스트 신청', icon: 'plus', aside: '남양주 가게·관광지·주민' },
  { href: '/login', label: '로그아웃', icon: 'logout' },
]
