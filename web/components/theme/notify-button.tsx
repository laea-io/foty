'use client'

import { useState, useTransition } from 'react'
import { setSubscriptionAction } from '@/app/actions/a'
import { Button } from '@/components/ui/primitives'

/** “새 테마 알림 받기” — 새 테마가 게시되면 알림으로 알려 준다(subscriptions kind 'all') */
export function NotifyButton({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial)
  const [error, setError] = useState(false)
  const [pending, start] = useTransition()
  const toggle = () =>
    start(async () => {
      const r = await setSubscriptionAction('all', '', !on)
      if (r.ok) {
        setOn(!on)
        setError(false)
      } else setError(true)
    })
  return (
    <>
      <Button
        variant="outline"
        icon={on ? 'check' : 'bell'}
        className="h-[52px]"
        onClick={toggle}
        disabled={pending}
      >
        {on ? '새 테마가 열리면 알려드려요' : '새 테마 알림 받기'}
      </Button>
      {error && <p className="m-0 text-center text-[12px] text-warn">저장하지 못했어요. 다시 눌러 주세요.</p>}
    </>
  )
}
