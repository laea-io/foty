'use client'

import { useActionState, useState } from 'react'
import { joinAction, soloAction } from '@/app/actions/b-themes'
import { Button, buttonClass } from '@/components/ui/primitives'

const bare = (url: string) => url.replace(/^https?:\/\//, '')

/** 초대 링크 + 복사 */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* 권한 없음 */
    }
  }
  return (
    <div className="mt-4 flex h-[52px] items-center gap-2.5 rounded-[14px] bg-face pr-1.5 pl-4">
      <span className="min-w-0 grow truncate text-[14px] text-sub">{bare(url)}</span>
      <button type="button" onClick={copy} className={buttonClass('primary', 'sm', 'text-[13px]')}>
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  )
}

/** 링크 공유하기 — 시스템 공유 시트(카카오톡 등, 없으면 주소 복사). 이름은 호출하는 곳 때문에 그대로 */
export function KakaoShare({ title, url }: { title: string; url: string }) {
  const [done, setDone] = useState(false)
  const share = async () => {
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
    <button type="button" onClick={share} className={buttonClass('soft', 'lg', 'flex-1')}>
      {done ? '링크를 복사했어요' : '링크 공유하기'}
    </button>
  )
}

/** 혼자 신청으로 바꾸기(친구 자리 비우기) */
export function SoloButton({ themeId }: { themeId: string }) {
  const [state, action, pending] = useActionState(soloAction, undefined)
  return (
    <form action={action}>
      <input type="hidden" name="themeId" value={themeId} />
      {state?.error && <div className="mb-2 text-[13px] text-warn">{state.error}</div>}
      <Button type="submit" variant="outline" size="lg" disabled={pending}>
        혼자 신청으로 바꾸기
      </Button>
    </form>
  )
}

/** 초대 링크에서 함께 신청하기 */
export function JoinButton({ themeId, a, s }: { themeId: string; a: string; s: string }) {
  const [state, action, pending] = useActionState(joinAction, undefined)
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="themeId" value={themeId} />
      <input type="hidden" name="a" value={a} />
      <input type="hidden" name="s" value={s} />
      {state?.error && <div className="mb-2 text-[13px] text-warn">{state.error}</div>}
      <Button type="submit" variant="accent" size="lg" block disabled={pending}>
        함께 신청하기
      </Button>
    </form>
  )
}
