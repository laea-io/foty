// 시연 데이터 — 참여자 프로필의 동행 태그 횟수·여행 성향(그룹 A). people.ts를 감싼다.
import { type Person, personById } from './people'

const extra: Record<string, { counts: number[]; taste: string[] }> = {
  kanghyun: { counts: [], taste: ['산책', '카페', '사진', '여유롭게'] },
  yuna: { counts: [2, 1], taste: ['산책', '사진', '여유롭게', '조용한 편'] },
  jiho: { counts: [3, 2], taste: ['자연', '카페', '알차게'] },
  dohyun: { counts: [], taste: ['맛집', '적당히'] },
  harin: { counts: [5], taste: ['자연', '산책', '여유롭게', '상황에 따라'] },
  minjae: { counts: [], taste: ['카페', '활발한 편'] },
  junho: { counts: [1], taste: ['맛집', '산책', '적당히'] },
  seoyeon: { counts: [3], taste: ['사진', '산책', '조용한 편'] },
}

export type Profile = Person & { tagCounts: [string, number][]; taste: string[] }

export function profileById(id: string): Profile | undefined {
  const p = personById(id)
  if (!p) return undefined
  const e = extra[id] ?? { counts: [], taste: [] }
  return { ...p, tagCounts: p.tags.map((t, i) => [t, e.counts[i] ?? 1]), taste: e.taste }
}

/** 호스트에게 참여자들이 남긴 태그(시연) */
const hostTagMap: Record<string, [string, number][]> = {
  harin: [
    ['시간을 잘 지켜요', 3],
    ['변경 사항을 잘 알려줘요', 2],
    ['서로를 배려해요', 2],
  ],
  dasan: [
    ['설명이 친절해요', 3],
    ['시간을 잘 지켜요', 2],
  ],
  byeollae: [
    ['설명이 친절해요', 4],
    ['서로를 배려해요', 2],
  ],
  jiho: [
    ['시간을 잘 지켜요', 2],
    ['변경 사항을 잘 알려줘요', 1],
  ],
  seoyeon: [['서로를 배려해요', 2]],
  supgil: [['설명이 친절해요', 1]],
}
export const hostTags = (id: string) => hostTagMap[id] ?? []
