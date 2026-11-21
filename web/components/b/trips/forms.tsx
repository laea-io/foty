'use client'

// 여행 화면의 작은 쓰기 버튼들 — 서버 액션(app/actions/b-trips.ts)을 부른다. 실패 문장은 버튼 위에.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useState, useTransition } from 'react'
import {
  askHostAction,
  blockAction,
  confirmChangeAction,
  demoCheckinAction,
  proposeAiAction,
  tellAttendedAction,
} from '@/app/actions/b-trips'
import { Icon } from '@/components/ui/icon'
import { Button, buttonClass } from '@/components/ui/primitives'

const Err = ({ text }: { text?: string }) =>
  text ? <div className="mb-2 text-[13px] text-warn">{text}</div> : null

/** 변경 확인 카드의 “확인했어요” */
export function ConfirmChange({
  themeId,
  changeId,
  done,
}: {
  themeId: string
  changeId: string
  done: boolean
}) {
  const [state, action, pending] = useActionState(confirmChangeAction, undefined)
  const ok = done || !!state?.ok
  return (
    <form action={action} className="flex-1">
      <input type="hidden" name="themeId" value={themeId} />
      <input type="hidden" name="changeId" value={changeId} />
      <Err text={state?.error} />
      <Button type="submit" size="sm" block disabled={ok || pending} icon={ok ? 'check' : undefined}>
        {ok ? '확인 완료' : '확인했어요'}
      </Button>
    </form>
  )
}

/** 지난 여행 · 검토 중 — “참여했다고 알리기” */
export function TellAttended({ themeId, told }: { themeId: string; told: boolean }) {
  const [state, action, pending] = useActionState(tellAttendedAction, undefined)
  const on = told || !!state?.ok
  return (
    <form action={action}>
      <input type="hidden" name="themeId" value={themeId} />
      <Err text={state?.error} />
      <button type="submit" disabled={on || pending} className={buttonClass('outline', 'sm', 'w-full')}>
        {on && <Icon name="check" size={16} weight={1.8} />}
        {on ? '호스트에게 알렸어요' : '참여했다고 알리기'}
      </button>
    </form>
  )
}

/** “QR이 안 돼요 · 호스트에게 확인 요청” */
export function AskHost({ themeId, wide }: { themeId: string; wide?: boolean }) {
  const [state, action, pending] = useActionState(askHostAction, undefined)
  const on = !!state?.ok
  return (
    <form action={action} className={wide ? '' : 'w-full'}>
      <input type="hidden" name="themeId" value={themeId} />
      <Err text={state?.error} />
      <button
        type="submit"
        disabled={on || pending}
        className={buttonClass('outline', 'md', wide ? '' : 'h-[52px] w-full')}
      >
        {on ? '호스트에게 확인을 부탁했어요' : 'QR이 안 돼요 · 호스트에게 확인 요청'}
      </button>
    </form>
  )
}

/** 시연(DEMO_MODE=1): QR 없이 체크인 */
export function DemoCheckin({ themeId }: { themeId: string }) {
  const [state, action, pending] = useActionState(demoCheckinAction, undefined)
  return (
    <form action={action}>
      <input type="hidden" name="themeId" value={themeId} />
      <Err text={state?.error} />
      <button
        type="submit"
        disabled={pending}
        className="border-0 bg-transparent p-0 text-[12px] font-semibold text-sub underline underline-offset-2"
      >
        시연: 체크인하기
      </button>
    </form>
  )
}

/** 참여자 더보기의 “차단하기” */
export function BlockButton({ themeId, handle }: { themeId: string; handle: string }) {
  const [state, action, pending] = useActionState(blockAction, undefined)
  const on = !!state?.ok
  return (
    <form action={action}>
      <input type="hidden" name="themeId" value={themeId} />
      <input type="hidden" name="handle" value={handle} />
      <Err text={state?.error} />
      <button
        type="submit"
        disabled={on || pending}
        className="flex h-14 w-full items-center gap-3.5 border-0 border-t border-line bg-transparent p-0 text-left text-[16px] text-ink"
      >
        <Icon name={on ? 'check' : 'shield'} size={20} weight={1.7} />
        {on ? '차단했어요' : '차단하기'}
      </button>
    </form>
  )
}

/** AI 결과의 “코스에 제안” — 모바일은 제안 뒤 일정으로 돌아간다 */
export function ProposeButton({
  themeId,
  placeId,
  wide,
}: {
  themeId: string
  placeId: string
  wide?: boolean
}) {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const send = () =>
    start(async () => {
      const r = await proposeAiAction({ themeId, placeId })
      if (!r.ok) return setError(r.error)
      setError('')
      setDone(true)
      if (!wide) router.push(`/trips/${themeId}`)
    })
  return (
    <div className="flex flex-none flex-col items-end">
      {error && <div className="mb-1 max-w-[180px] text-right text-[12px] text-warn">{error}</div>}
      {done && wide ? (
        <Link href={`/trips/${themeId}/history`} className={buttonClass('soft', 'sm')}>
          <Icon name="check" size={16} weight={1.8} />
          제안했어요
        </Link>
      ) : (
        <button type="button" onClick={send} disabled={pending || done} className={buttonClass('soft', 'sm')}>
          {done ? '제안했어요' : '코스에 제안'}
        </button>
      )}
    </div>
  )
}
