'use client'

import { useEffect, useState, useTransition } from 'react'
import { markReadAction, savePrivacyAction, setBlockAction, setSubscriptionAction } from '@/app/actions/a'
import type { IconName } from '@/components/ui/icon'
import { Button } from '@/components/ui/primitives'
import { Switch } from './toggle'

/** 공개 범위 한 줄 — 누르면 바로 저장(실패하면 되돌리고 문장을 보여 준다) */
export function PrivacyRow({
  k,
  title,
  sub,
  initial,
}: {
  k: string
  title: string
  sub?: string
  initial: boolean
}) {
  const [on, setOn] = useState(initial)
  const [err, setErr] = useState<string>()
  const [pending, start] = useTransition()
  const change = (v: boolean) => {
    setOn(v)
    setErr(undefined)
    start(async () => {
      const r = await savePrivacyAction(k, v)
      if (!r.ok) {
        setOn(!v)
        setErr(r.error)
      }
    })
  }
  return (
    <div className="border-t border-line py-4" aria-busy={pending}>
      <div className="flex items-center gap-3">
        <div className="grow">
          <div className="text-[15px] font-semibold">{title}</div>
          {sub && <div className="mt-0.5 text-[12px] text-sub">{sub}</div>}
        </div>
        <Switch on={on} onChange={change} label={title} />
      </div>
      {err && <p className="m-0 mt-2 text-[13px] text-warn">{err}</p>}
    </div>
  )
}

/** 차단 ↔ 해제(바로 저장, 글자만 바뀐다) */
export function BlockButton({
  userId,
  initial,
  off,
  on,
  size = 'sm',
}: {
  userId: string
  initial: boolean
  /** 차단 안 된 상태의 글자 */
  off: string
  /** 차단된 상태의 글자 */
  on: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const [blocked, setBlocked] = useState(initial)
  const [pending, start] = useTransition()
  return (
    <Button
      variant="outline"
      size={size}
      aria-pressed={blocked}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setBlockAction(userId, !blocked)
          if (r.ok) setBlocked(!blocked)
        })
      }
    >
      {blocked ? on : off}
    </Button>
  )
}

/** 새 테마 알림 받기(구독 행을 켜고 끈다) */
export function SubscribeButton({
  kind,
  k,
  initial,
  off = '새 테마 알림 받기',
  on = '새 테마가 열리면 알려드려요',
  variant = 'outline',
  size,
  block,
  className,
  icon = 'bell',
  onIcon = 'check',
}: {
  kind: 'host' | 'place' | 'all'
  k: string
  initial: boolean
  off?: string
  on?: string
  variant?: 'primary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  className?: string
  icon?: IconName
  onIcon?: IconName
}) {
  const [v, setV] = useState(initial)
  const [pending, start] = useTransition()
  return (
    <Button
      variant={variant}
      size={size}
      block={block}
      className={className}
      icon={v ? onIcon : icon}
      aria-pressed={v}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setSubscriptionAction(kind, k, !v)
          if (r.ok) setV(!v)
        })
      }
    >
      {v ? on : off}
    </Button>
  )
}

/** 알림 화면을 열면 읽음 처리(점은 이번 화면에서는 그대로, 다음에 열 때 사라진다) */
export function MarkAllRead({ any }: { any: boolean }) {
  useEffect(() => {
    if (any) void markReadAction()
  }, [any])
  return null
}
