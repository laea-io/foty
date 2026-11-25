'use client'

import { useState, useTransition } from 'react'
import { subscribeAction } from '@/app/actions/themes'
import { Button, ButtonLink } from '@/components/ui/primitives'

/** “새 날짜 알림 받기” — 이 호스트가 새 테마를 열면 알림(subscriptions kind=host) */
export function NotifyDate({
  hostId,
  themeId,
  on: initial,
  loggedIn,
}: {
  hostId: string
  themeId: string
  on: boolean
  loggedIn: boolean
}) {
  const [on, setOn] = useState(initial)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  if (!loggedIn)
    return (
      <ButtonLink href={`/login?next=/themes/${themeId}`} size="lg" block icon="bell">
        새 날짜 알림 받기
      </ButtonLink>
    )
  const toggle = () =>
    start(async () => {
      const r = await subscribeAction({ hostId, themeId, on: !on })
      if (r.ok) {
        setOn(!on)
        setError('')
      } else setError(r.error)
    })
  return (
    <>
      {error && <div className="mb-2 text-[13px] text-warn">{error}</div>}
      <Button
        size="lg"
        block
        icon={on ? 'check' : 'bell'}
        aria-pressed={on}
        disabled={pending}
        onClick={toggle}
      >
        {on ? '새 날짜가 열리면 알려드려요' : '새 날짜 알림 받기'}
      </Button>
    </>
  )
}
