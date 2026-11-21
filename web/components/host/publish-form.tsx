'use client'

import { useActionState } from 'react'
import { publishThemeAction } from '@/app/actions/c'
import { Button } from '@/components/ui/primitives'
import { keep } from '@/lib/client/keep-form'

/** 초안을 그대로 게시 — 숨은 칸으로 전부 보낸다. 실패 문장은 여기서 보여 준다 */
export function PublishForm({ id, fields }: { id: string; fields: Record<string, string> }) {
  const [state, send] = useActionState(publishThemeAction, undefined)
  return (
    <form id={id} onSubmit={keep(send)}>
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
