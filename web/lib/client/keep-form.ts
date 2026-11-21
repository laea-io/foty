'use client'

import { type FormEvent, startTransition } from 'react'

/**
 * 서버 액션을 보내되, 실패했을 때 쓴 내용이 지워지지 않게 한다.
 * (<form action={…}>은 React 19에서 제출 뒤 폼을 비운다 — 비밀번호가 틀리면 이메일까지 사라짐)
 * 사용: <form onSubmit={keep(formAction)}>  — 누른 버튼의 name/value도 함께 보낸다.
 */
export function keep(formAction: (f: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null
    const data = new FormData(e.currentTarget, submitter)
    startTransition(() => formAction(data))
  }
}
