'use client'

import { useActionState, useEffect } from 'react'
import { publishThemeAction } from '@/app/actions/c'
import { Button } from '@/components/ui/primitives'
import { keep } from '@/lib/client/keep-form'

/** 초안을 그대로 게시 — 숨은 칸으로 전부 보낸다. 실패 문장은 여기서 보여 준다 */
export function PublishForm({ id, fields }: { id: string; fields: Record<string, string> }) {
  const [state, send, pending] = useActionState(publishThemeAction, undefined)
  // 밖의 "이대로 게시하기" 버튼을 보내는 동안 잠근다(두 번 눌러 테마가 둘 생기지 않게)
  useEffect(() => {
    for (const b of document.querySelectorAll<HTMLButtonElement>(`button[form="${id}"]`)) b.disabled = pending
  }, [pending, id])
  const submit = keep(send)
  return (
    <form
      id={id}
      onSubmit={(e) => {
        if (pending) return e.preventDefault()
        submit(e)
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {state?.error && (
        <div className="mt-3 rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[13px] text-warn">
          {state.error}
        </div>
      )}
    </form>
  )
}

export function PublishButton({ form }: { form: string }) {
  return (
    <Button type="submit" form={form} size="lg" block>
      이대로 게시하기
    </Button>
  )
}
