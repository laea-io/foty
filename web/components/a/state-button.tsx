'use client'

import { useState } from 'react'
import type { IconName } from '@/components/ui/icon'
import { Button } from '@/components/ui/primitives'

/** 누르면 글자만 바뀌는 시연 버튼(차단 ↔ 차단 해제, 새 테마 알림 받기 등) */
export function StateButton({
  off,
  on,
  size = 'sm',
  variant = 'outline',
  icon,
  onIcon,
  block,
}: {
  off: string
  on: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'outline'
  icon?: IconName
  onIcon?: IconName
  block?: boolean
}) {
  const [v, setV] = useState(false)
  return (
    <Button
      variant={variant}
      size={size}
      icon={v ? (onIcon ?? icon) : icon}
      block={block}
      aria-pressed={v}
      onClick={() => setV(!v)}
    >
      {v ? on : off}
    </Button>
  )
}
