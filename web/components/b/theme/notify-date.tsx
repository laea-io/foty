'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives'

/** “새 날짜 알림 받기” — 시연에서는 누르면 상태만 바뀐다 */
export function NotifyDate() {
  const [on, setOn] = useState(false)
  return (
    <Button size="lg" block icon={on ? 'check' : 'bell'} aria-pressed={on} onClick={() => setOn(!on)}>
      {on ? '새 날짜가 열리면 알려드려요' : '새 날짜 알림 받기'}
    </Button>
  )
}
