'use client'

import { useState } from 'react'
import { buttonClass } from '@/components/ui/primitives'

/** 초대 링크 + 복사 */
export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* 권한 없음 */
    }
  }
  return (
    <div className="mt-4 flex h-[52px] items-center gap-2.5 rounded-[14px] bg-face pr-1.5 pl-4">
      <span className="min-w-0 grow truncate text-[14px] text-sub">{link}</span>
      <button type="button" onClick={copy} className={buttonClass('primary', 'sm', 'text-[13px]')}>
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  )
}

/** 카카오톡으로 보내기 — 시연에서는 시스템 공유 시트(없으면 주소 복사) */
export function KakaoShare({ title, link }: { title: string; link: string }) {
  const [done, setDone] = useState(false)
  const share = async () => {
    const url = `https://${link}`
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        setDone(true)
        setTimeout(() => setDone(false), 1800)
      }
    } catch {
      /* 사용자가 닫음 */
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      className={buttonClass('soft', 'lg', 'flex-1 bg-kakao text-[#191600]')}
    >
      {done ? '링크를 복사했어요' : '카카오톡으로 보내기'}
    </button>
  )
}
