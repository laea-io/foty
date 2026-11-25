'use client'

import { type ReactNode, useActionState, useEffect, useRef } from 'react'
import { keep } from '@/lib/client/keep-form'
import type { FormState } from '@/lib/server/util/form'

/**
 * 서버 액션 폼 + 실패 문장. 제출 버튼은 밖(BottomBar)에 form 속성으로 둘 수 있다.
 * 보내는 동안은 칸·버튼을 잠가 두 번 눌러도 한 번만 간다(밖의 버튼은 fieldset 밖이라 data-pending으로 막는다).
 */
export function ActionForm({
  id,
  action,
  children,
  className,
  resetOnDone,
}: {
  id: string
  action: (s: FormState, f: FormData) => Promise<FormState>
  children: ReactNode
  className?: string
  /** 성공하면 칸을 비운다(공지·답변처럼 계속 쓰는 폼) */
  resetOnDone?: boolean
}) {
  const [state, send, pending] = useActionState(action, undefined)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.done && resetOnDone) ref.current?.reset()
  }, [state, resetOnDone])
  // 폼 밖의 제출 버튼(form 속성)도 보내는 동안 잠근다
  useEffect(() => {
    for (const b of document.querySelectorAll<HTMLButtonElement>(`button[form="${id}"]`)) b.disabled = pending
  }, [pending, id])
  const submit = keep(send)
  return (
    <form
      ref={ref}
      id={id}
      onSubmit={(e) => {
        if (pending) return e.preventDefault()
        submit(e)
      }}
      className={className}
      aria-busy={pending}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.error && (
        <div className="mt-3 rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[13px] text-warn">
          {state.error}
        </div>
      )}
      {state?.done && <div className="mt-3 text-[13px] text-sub">반영했어요</div>}
    </form>
  )
}
