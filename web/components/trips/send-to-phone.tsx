'use client'

import { useState, useTransition } from 'react'
import { sendCheckinLinkAction } from '@/app/actions/trips'
import { Button } from '@/components/ui/primitives'

/** 체크인 링크를 내 계정 알림으로 보낸다 — 휴대폰에서 foty 알림을 열면 바로 체크인 화면 */
export function SendToPhone({ themeId }: { themeId: string }) {
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()
  return (
    <Button
      size="md"
      icon={sent ? 'check' : undefined}
      disabled={pending || sent}
      onClick={() =>
        start(async () => {
          const r = await sendCheckinLinkAction(themeId)
          setSent(r.ok)
        })
      }
    >
      {sent ? '알림으로 보냈어요 · 휴대폰에서 foty 알림을 열어 주세요' : '내 휴대폰으로 링크 보내기'}
    </Button>
  )
}
