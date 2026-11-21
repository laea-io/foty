'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives'

/** “새 테마 알림 받기” — 시연에서는 누르면 상태만 바뀐다 */
export function NotifyButton() {
  const [on, setOn] = useState(false)
  return (
    <Button variant="outline" icon={on ? 'check' : 'bell'} className="h-[52px]" onClick={() => setOn(!on)}>
      {on ? '새 테마가 열리면 알려드려요' : '새 테마 알림 받기'}
    </Button>
  )
}
