// 시연 데이터 — 사람. /design 쇼케이스(DEMO_MODE)에서만 쓴다.
import type { Person } from '@/lib/shared/people'

const me: Person = {
  id: 'kanghyun',
  name: '강현',
  from: '상봉·중랑',
  trips: 0,
  tags: [],
  mbti: 'INFP',
}

const people: Person[] = [
  me,
  { id: 'yuna', name: '유나', from: '상봉·중랑', trips: 3, tags: ['서로를 배려해요', '시간을 잘 지켜요'] },
  { id: 'jiho', name: '지호', from: '구리', trips: 5, tags: ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요'] },
  { id: 'dohyun', name: '도현', from: '청량리', trips: 0, tags: [] },
  { id: 'harin', name: '하린', from: '진접', trips: 7, tags: ['서로를 배려해요'] },
  { id: 'minjae', name: '민재', from: '잠실', trips: 1, tags: [] },
  { id: 'junho', name: '준호', from: '상봉·중랑', trips: 2, tags: ['시간을 잘 지켜요'] },
  { id: 'seoyeon', name: '서연', from: '덕소', trips: 4, tags: ['서로를 배려해요'] },
]
export const personById = (id: string) => people.find((p) => p.id === id)
