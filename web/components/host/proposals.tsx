'use client'

import { useActionState } from 'react'
import { decideChangeAction } from '@/app/actions/c'
import { Badge, type BadgeTone } from '@/components/ui/primitives'

export type ProposalItem = {
  id: string
  who: string
  what: string
  from: string
  to: string
  status: '제안됨' | '변경 확인 중' | '반영됨' | '반려됨'
  major: boolean
  confirm?: string
}
const tone: Record<string, BadgeTone> = {
  제안됨: 'soft',
  '변경 확인 중': 'warn',
  반영됨: 'ink',
  반려됨: 'muted',
}

/** 들어온 제안 — 작은 변경은 호스트가 반영/반려, 주요 변경은 참여자 확인을 기다린다 */
export function Proposals({ themeId, items }: { themeId: string; items: ProposalItem[] }) {
  const [state, send, pending] = useActionState(decideChangeAction, undefined)
  const open = items.filter((p) => p.status === '제안됨' || p.status === '변경 확인 중')
  return (
    <>
      <div className="mt-[30px] mb-3 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">들어온 제안</h2>
        <span className="text-[12px] text-sub">{open.length}</span>
      </div>
      {!open.length && (
        <div className="border-t border-line py-6 text-center text-[13px] text-sub">정리할 제안이 없어요</div>
      )}
      {open.map((p) => (
        <div key={p.id} className="border-t border-line py-4">
          <div className="flex items-center justify-between">
            <Badge tone={tone[p.status]}>{p.status}</Badge>
            <span className="text-[12px] text-muted">{p.confirm ?? p.who}</span>
          </div>
          <div className="mt-2.5 text-[15px] font-semibold">{p.what}</div>
          <div className="mt-1 flex items-baseline gap-2 text-[14px]">
            <span className="text-muted line-through">{p.from}</span>
            <span className="font-bold">{p.to}</span>
          </div>
          <form action={send} className="mt-3 flex gap-2">
            <input type="hidden" name="theme" value={themeId} />
            <input type="hidden" name="change" value={p.id} />
            {!p.major && (
              <button
                type="submit"
                name="accept"
                value="1"
                disabled={pending}
                className="h-11 flex-1 rounded-[12px] border-0 bg-ink text-[13px] font-semibold text-white disabled:opacity-40"
              >
                반영
              </button>
            )}
            <button
              type="submit"
              name="accept"
              value="0"
              disabled={pending}
              className="h-11 flex-1 rounded-[12px] border-0 bg-white text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--color-line-2)] disabled:opacity-40"
            >
              {p.major ? '제안 거두기' : '반려'}
            </button>
          </form>
        </div>
      ))}
      {state?.error && <div className="mt-2 text-[13px] text-warn">{state.error}</div>}
    </>
  )
}
