// 시연 데이터 — 알림(그룹 A)
export type Notice = { id: string; title: string; body: string; when: string; unread: boolean; href: string }

export const notices: Notice[] = [
  {
    id: 'matched',
    title: '테마가 성사됐어요',
    body: '광릉숲 전나무길 아침 산책 · 그룹 공간이 열렸어요',
    when: '방금',
    unread: true,
    href: '/themes/gwangneung-morning/matched',
  },
  {
    id: 'stamp',
    title: '스탬프를 받았어요',
    body: '두물머리 · 팔당·조안 수변',
    when: '11.8',
    unread: true,
    href: '/my/stamps',
  },
  {
    id: 'meet-change',
    title: '집결 시간 변경 확인이 필요해요',
    body: '08:40 → 08:20 · 호스트 하린',
    when: '1시간 전',
    unread: true,
    href: '/trips/gwangneung-morning',
  },
  {
    id: 'accepted',
    title: '신청이 수락됐어요',
    body: '한정식 점심과 여유당 산책 · 최소 인원이 채워졌어요',
    when: '어제',
    unread: false,
    href: '/themes/dasan-lunch',
  },
  {
    id: 'new-theme',
    title: '하린 님이 새 테마를 열었어요',
    body: '광릉숲 전나무길 아침 산책 · 11.29 (일)',
    when: '2일 전',
    unread: false,
    href: '/hosts/harin',
  },
  {
    id: 'tomorrow',
    title: '내일 출발이에요',
    body: '로스터리에서 배우는 핸드드립 · 참석을 다시 확인해 주세요',
    when: '3일 전',
    unread: false,
    href: '/trips/byeollae-drip',
  },
]

/** 데스크톱 아트보드는 스탬프 알림이 맨 위 */
export const desktopNotices = [notices[1], notices[0], ...notices.slice(2)]
