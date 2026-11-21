'use client'

import { useActionState, useRef } from 'react'
import { answerAction } from '@/app/actions/c'
import { TextArea } from '@/components/c/form'
import { Button } from '@/components/ui/primitives'

export function AnswerForm({ postId }: { postId: string }) {
  const ref = useRef<HTMLFormElement>(null)
  const [state, send, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof answerAction>>, f: FormData) => {
      const r = await answerAction(prev, f)
      if (r?.done) ref.current?.reset()
      return r
    },
    undefined,
  )
  return (
    <form ref={ref} action={send} className="mt-3">
      <input type="hidden" name="post" value={postId} />
      <TextArea
        name="body"
        rows={3}
        placeholder="아는 만큼 알려 주세요. 개인 연락처는 적지 말아 주세요."
        aria-label="답변"
        required
      />
      {state?.error && <div className="mt-2 text-[13px] text-warn">{state.error}</div>}
      <Button type="submit" size="sm" block className="mt-2" disabled={pending}>
        답변 올리기
      </Button>
    </form>
  )
}
