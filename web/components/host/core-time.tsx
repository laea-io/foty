'use client'

import { useActionState, useState } from 'react'
import { coreTimeAction } from '@/app/actions/c'

/** 핵심 장소 시간 바꾸기 — 주요 변경이라 참여자 모두에게 확인 요청이 간다 */
export function CoreTime({ themeId, from }: { themeId: string; from: string }) {
  const [open, setOpen] = useState(false)
  const [state, send, pending] = useActionState(coreTimeAction, undefined)
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-0 bg-transparent text-[13px] font-semibold underline"
      >
        시간 바꾸기
      </button>
    )
  return (
    <form action={send} className="flex items-center gap-1.5">
      <input type="hidden" name="theme" value={themeId} />
      <input type="hidden" name="from" value={from} />
      <input
        type="time"
        name="time"
        defaultValue={from}
        aria-label="새 시간"
        className="h-9 w-[92px] rounded-[10px] border-0 bg-white px-2 text-[14px]"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-[10px] border-0 bg-ink px-3 text-[12px] font-semibold text-white"
      >
        제안
      </button>
      {state?.error && <span className="text-[12px] text-warn">{state.error}</span>}
    </form>
  )
}
