// 시연 데이터 — 그룹 대화. 실제 대화가 아니다.
export type ChatMessage = {
  id: string
  /** 보낸 사람 이름. 'me'면 내 말풍선 */
  from: string
  /** 이름 옆 표시(호스트) */
  role?: string
  text: string
  /** 데스크톱에서 다르게 쓰인 문장 */
  wideText?: string
  time: string
  /** 데스크톱에서 아바타를 붙인다 */
  avatar?: boolean
}

export const chatDay = '11월 21일 토요일'

export const chat: ChatMessage[] = [
  {
    id: 'm1',
    from: '하린',
    role: '호스트',
    text: '안녕하세요! 이번 주 날씨 괜찮대요.\n집결은 상봉역 1번 출구 앞이에요.',
    wideText: '안녕하세요! 내일 날씨 괜찮대요.\n집결은 상봉역 1번 출구 앞이에요.',
    time: '10:12',
    avatar: true,
  },
  { id: 'm2', from: '유나', text: '점심은 코스에 있는 숲길 밥상으로 가는 거죠?', time: '10:20' },
  { id: 'm3', from: 'me', text: '네 좋아요! 8시 20분 집결 괜찮아요.', time: '10:24' },
]
