'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { adminResetLinkAction, forgotAction, resetAction } from '@/app/actions/reset'
import { Field } from '@/components/a/form'
import { Button } from '@/components/ui/primitives'
import { keep } from '@/lib/client/keep-form'

export function ForgotForm({ mail }: { mail: boolean }) {
  const [state, send, pending] = useActionState(forgotAction, undefined)
  if (!mail)
    return (
      <div className="mt-6 text-[14px] leading-6 text-sub">
        지금은 메일로 찾기를 준비하고 있어요. 고객센터에 문의해 주시면 운영팀이 재설정 링크를 보내 드려요.
        카카오로 로그인한다면 <b className="text-ink">마이 › 계정</b>에서 비밀번호를 정할 수 있어요.
        <div className="mt-4">
          <Link href="/support" className="font-semibold text-ink">
            고객센터로
          </Link>
        </div>
      </div>
    )
  if (state?.done)
    return (
      <p className="mt-6 text-[14px] leading-6 text-sub">
        가입한 메일이면 재설정 링크를 보냈어요. 30분 안에 메일의 링크를 눌러 주세요.
      </p>
    )
  return (
    <form onSubmit={keep(send)} className="mt-6">
      <Field
        label="가입한 이메일"
        name="email"
        type="email"
        placeholder="example@foty.kr"
        autoComplete="email"
      />
      {state?.error && <p className="mt-3 text-[13px] text-warn">{state.error}</p>}
      <Button type="submit" size="lg" block className="mt-6" disabled={pending}>
        재설정 링크 받기
      </Button>
    </form>
  )
}

export function ResetForm({ token }: { token: string }) {
  const [state, send, pending] = useActionState(resetAction, undefined)
  return (
    <form onSubmit={keep(send)} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field
        label="새 비밀번호"
        name="password"
        type="password"
        placeholder="8자 이상"
        autoComplete="new-password"
      />
      <Field
        label="한 번 더"
        name="password2"
        type="password"
        placeholder="같은 비밀번호"
        autoComplete="new-password"
      />
      {state?.error && <p className="m-0 text-[13px] text-warn">{state.error}</p>}
      <Button type="submit" size="lg" block className="mt-2" disabled={pending}>
        비밀번호 바꾸기
      </Button>
    </form>
  )
}

/** 운영팀 화면: 재설정 링크 만들기(한 번만 보여 준다) */
export function AdminResetLink({ userId }: { userId: string }) {
  const [state, send, pending] = useActionState(adminResetLinkAction, undefined)
  return (
    <form onSubmit={keep(send)} className="mt-2">
      <input type="hidden" name="userId" value={userId} />
      {state?.link ? (
        <div className="rounded-[10px] bg-face px-3 py-2 text-[12px] break-all">
          30분 동안 쓸 수 있는 링크 — 본인에게만 전해 주세요
          <br />
          <span className="text-ink select-all">{state.link}</span>
        </div>
      ) : (
        <Button type="submit" variant="outline" size="sm" block disabled={pending}>
          비밀번호 재설정 링크 만들기
        </Button>
      )}
      {state?.error && <p className="m-0 mt-1 text-[12px] text-warn">{state.error}</p>}
    </form>
  )
}
