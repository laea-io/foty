'use client'

import Link from 'next/link'
import { useState } from 'react'
import { skipRequestAction } from '@/app/actions/c'
import { Chip } from '@/components/ui/primitives'

type Req = { id: string; text: string; when: string; tags: string[]; same: number }

/** 테마 요청 목록 — 종류 칩으로 거르고, 넘기기는 서버에 저장(이 호스트 화면에서만 숨김) */
export function RequestsList({ list }: { list: Req[] }) {
  const [tag, setTag] = useState('전체')
  const count = (t: string) => list.filter((r) => r.tags.includes(t)).length
  const tags = ['전체', ...[...new Set(list.flatMap((r) => r.tags))]]
  const shown = list.filter((r) => tag === '전체' || r.tags.includes(tag))
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
                href={`/host/new?request=${r.id}`}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] bg-ink text-[13px] font-semibold text-white no-underline"
              >
                이 요청으로 테마 열기
              </Link>
              <form action={skipRequestAction}>
                <input type="hidden" name="request" value={r.id} />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-[12px] border-0 bg-white px-[18px] text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--color-line-2)]"
                >
                  넘기기
                </button>
              </form>
            </div>
          </div>
        ))}
        {!shown.length && <div className="py-10 text-center text-[13px] text-sub">남은 요청이 없어요</div>}
      </div>
    </>
  )
}
