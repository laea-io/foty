'use client'

import { type ReactNode, useActionState } from 'react'
import type { FormState } from '@/app/actions/c'

/** 서버 액션 폼 + 실패 문장. 제출 버튼은 밖(BottomBar)에 form 속성으로 둘 수 있다 */
export function ActionForm({
  id,
  action,
  children,
  className,
}: {
  id: string
  action: (s: FormState, f: FormData) => Promise<FormState>
  children: ReactNode
  className?: string
}) {
  const [state, send] = useActionState(action, undefined)
  return (
    <form id={id} action={send} className={className}>
      {children}
      {state?.error && (
        <div className="mt-3 rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[13px] text-warn">
          {state.error}
        </div>
      )}
      {state?.done && <div className="mt-3 text-[13px] text-sub">반영했어요</div>}
    </form>
  )
}
