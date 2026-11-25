'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Badge, Chip, Note, Photo } from '@/components/ui/primitives'
import type { PlaceItem as Place } from '@/lib/server/queries/places'

const groups = ['전체', '자연', '카페', '맛집', '문화 공간'] as const

/** 핵심 장소 고르기 — 이름 찾기 + 종류 칩. 검토된 장소 목록 안에서만 찾는다 */
export function CorePick({
  places,
  counts,
  wide,
}: {
  places: Place[]
  counts: Record<string, number>
  wide?: boolean
}) {
  const [q, setQ] = useState('')
  const [g, setG] = useState<(typeof groups)[number]>('전체')
  const list = places.filter((p) => (g === '전체' || p.group === g) && (!q || p.name.includes(q.trim())))
  return (
    <>
      <label className="mt-2 flex h-[50px] items-center gap-2.5 rounded-[14px] bg-face px-4">
        <Icon name="search" size={18} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="장소 이름으로 찾기"
          className="h-full grow border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      <div className="no-scrollbar mt-3.5 flex gap-1.5 overflow-x-auto">
        {groups.map((x) => (
          <Chip key={x} selected={g === x} onClick={() => setG(x)}>
            {x}
          </Chip>
        ))}
      </div>
      <div className="mt-2.5">
        {list.map((p, i) => (
          <Link
            key={p.id}
            href={`/course?place=${p.id}`}
            className={`flex items-center gap-3.5 py-3 text-ink no-underline ${i ? 'border-t border-line' : ''}`}
          >
            <Photo
              src={p.image.src}
              alt={p.image.alt}
              bg={p.image.bg}
              className={`rounded-[12px] ${wide ? 'h-16 w-16' : 'h-14 w-14'}`}
            />
            <div className="min-w-0 grow">
              <div className="text-[15px] font-semibold">{p.name}</div>
              <div className="mt-0.5 text-[12px] text-sub">
                {p.area} · {p.kind} · {p.checked ? `${p.checked} 확인` : '재확인 필요'}
              </div>
            </div>
            {counts[p.id] > 0 && <Badge>열린 테마 {counts[p.id]}</Badge>}
          </Link>
        ))}
        {!list.length && (
          <div className="py-10 text-center text-[13px] text-sub">검토된 장소 중에 맞는 곳이 없어요</div>
        )}
      </div>
      <Note className="mt-4">검토된 장소 목록이에요. 실시간 검색 결과가 아니에요.</Note>
    </>
  )
}
