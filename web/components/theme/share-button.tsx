'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { buttonClass } from '@/components/ui/primitives'

/** 공유: 휴대폰은 시스템 공유 시트, 아니면 주소 복사 */
export function ShareButton({ title, wide }: { title: string; wide?: boolean }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      /* 사용자가 닫음 */
    }
  }
  if (wide)
    return (
      <button type="button" onClick={share} className={buttonClass('outline', 'lg')}>
        <Icon name={copied ? 'check' : 'share'} size={16} weight={1.8} />
        {copied ? '복사됨' : '공유'}
      </button>
    )
  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? '주소를 복사했어요' : '공유'}
      className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-[12px] border-0 bg-face"
    >
      <Icon name={copied ? 'check' : 'share'} />
    </button>
  )
}
