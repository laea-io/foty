'use client'

import { useState } from 'react'
import { Badge, type BadgeTone } from '@/components/ui/primitives'

type P = {
  id: string
  who: string
  what: string
  from: string
  to: string
  status: '제안됨' | '변경 확인 중'
  confirm?: string
}
const tone: Record<string, BadgeTone> = {
  제안됨: 'soft',
  '변경 확인 중': 'warn',
  반영됨: 'ink',
  반려됨: 'muted',
}

/** 들어온 제안 — 호스트가 반영/반려(시연: 화면 상태만) */
export function Proposals({ items }: { items: P[] }) {
  const [st, setSt] = useState<Record<string, string>>(Object.fromEntries(items.map((p) => [p.id, p.status])))
  return (
    <>
      <div className="mt-[30px] mb-3 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">들어온 제안</h2>
        <span className="text-[12px] text-sub">{items.length}</span>
      </div>
      {items.map((p) => {
        const s = st[p.id]
        return (
          <div key={p.id} className="border-t border-line py-4">
            <div className="flex items-center justify-between">
              <Badge tone={tone[s]}>{s}</Badge>
              <span className="text-[12px] text-muted">{p.confirm ?? p.who}</span>
            </div>
            <div className="mt-2.5 text-[15px] font-semibold">{p.what}</div>
            <div className="mt-1 flex items-baseline gap-2 text-[14px]">
              <span className="text-muted line-through">{p.from}</span>
              <span className="font-bold">{p.to}</span>
            </div>
            {s === '제안됨' && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSt({ ...st, [p.id]: '반영됨' })}
                  className="h-11 flex-1 rounded-[12px] border-0 bg-ink text-[13px] font-semibold text-white"
                >
                  반영
                </button>
                <button
                  type="button"
                  onClick={() => setSt({ ...st, [p.id]: '반려됨' })}
                  className="h-11 flex-1 rounded-[12px] border-0 bg-white text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--color-line-2)]"
                >
                  반려
                </button>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
