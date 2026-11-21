'use client'

import { createContext, type ReactNode, useActionState, useContext } from 'react'
import { keep } from '@/lib/client/keep-form'

type State = { error?: string } | undefined
const Ctx = createContext<{ state: State; pending: boolean }>({ state: undefined, pending: false })

/** 서버 액션 폼(useActionState). 실패 문장은 <FormError />가 놓인 자리에, 보내는 중엔 안의 버튼이 꺼진다 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: State, form: FormData) => Promise<State>
  children: ReactNode
  className?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  return (
    <Ctx.Provider value={{ state, pending }}>
      <form onSubmit={keep(formAction)} className={className}>
        <fieldset disabled={pending} className="contents">
          {children}
        </fieldset>
      </form>
    </Ctx.Provider>
  )
}

/** 실패 문장(버튼 위) */
export function FormError({ className }: { className?: string }) {
  const { state } = useContext(Ctx)
  if (!state?.error) return null
  return (
    <p role="alert" className={`m-0 text-[13px] text-warn ${className ?? ''}`}>
      {state.error}
    </p>
  )
}
