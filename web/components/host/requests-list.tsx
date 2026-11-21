'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Chip } from '@/components/ui/primitives'
import type { themeRequests } from '@/lib/demo/host'

type Req = (typeof themeRequests)[number]

/** 테마 요청 목록 — 종류 칩으로 거르고, 넘기기로 숨긴다 */
export function RequestsList({ list }: { list: Req[] }) {
  const [tag, setTag] = useState('전체')
  const [hidden, setHidden] = useState<string[]>([])
  const count = (t: string) => list.filter((r) => r.tags.includes(t)).length
  const tags = ['전체', '맛집', '산책', '카페']
  const shown = list.filter((r) => !hidden.includes(r.id) && (tag === '전체' || r.tags.includes(tag)))
  return (
    <>
      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto">
        {tags.map((t) => (
          <Chip key={t} selected={tag === t} onClick={() => setTag(t)}>
            {t} {t === '전체' ? list.length : count(t)}
          </Chip>
        ))}
      </div>
      <div className="mt-2">
        {shown.map((r) => (
          <div key={r.id} className="border-t border-line py-4 first:border-t-0">
            <div className="text-[15px] leading-[22px]">{r.text}</div>
            <div className="mt-2 text-[12px] text-sub">
              {r.when} · {r.tags.join(', ')} · 같은 요청 {r.same}명
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href="/host/new"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] bg-ink text-[13px] font-semibold text-white no-underline"
              >
                이 요청으로 테마 열기
              </Link>
              <button
                type="button"
                onClick={() => setHidden([...hidden, r.id])}
                className="inline-flex h-11 items-center justify-center rounded-[12px] border-0 bg-white px-[18px] text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--color-line-2)]"
              >
                넘기기
              </button>
            </div>
          </div>
        ))}
        {!shown.length && <div className="py-10 text-center text-[13px] text-sub">남은 요청이 없어요</div>}
      </div>
    </>
  )
}
