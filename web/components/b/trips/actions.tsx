'use client'

import { type ReactNode, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { buttonClass } from '@/components/ui/primitives'

type Variant = Parameters<typeof buttonClass>[0]
type Size = Parameters<typeof buttonClass>[1]

/** 글자 있는 공유 버튼(친구에게 공유 · 가족에게 일정 공유). 휴대폰은 공유 시트, 아니면 주소 복사 */
export function ShareAction({
  label,
  title,
  path,
  variant = 'primary',
  size = 'sm',
  className,
}: {
  label: string
  title: string
  /** 공유할 주소(없으면 지금 주소) */
  path?: string
  variant?: Variant
  size?: Size
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = path ? new URL(path, window.location.origin).href : window.location.href
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
  return (
    <button type="button" onClick={share} className={buttonClass(variant, size, className)}>
      <Icon name={copied ? 'check' : 'share'} size={16} weight={1.8} />
      {copied ? '주소를 복사했어요' : label}
    </button>
  )
}

/** 누르면 상태만 바뀌는 버튼(시연) */
export function ToggleButton({
  label,
  done,
  variant = 'outline',
  size = 'sm',
  className,
}: {
  label: string
  done: string
  variant?: Variant
  size?: Size
  className?: string
}) {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn(!on)}
      className={buttonClass(variant, size, className)}
    >
      {on && <Icon name="check" size={16} weight={1.8} />}
      {on ? done : label}
    </button>
  )
}

/** 코스 일정 ↔ 지도 전환 */
export function CourseToggle({ list, map }: { list: ReactNode; map: ReactNode }) {
  const [view, setView] = useState<'list' | 'map'>('list')
  return (
    <>
      <div className="mt-[-2px] mb-1 flex rounded-full bg-face p-1" role="tablist" aria-label="코스 보기">
        {(
          [
            ['list', '일정'],
            ['map', '지도'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={view === k}
            onClick={() => setView(k)}
            className={`flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-full border-0 text-[13px] ${
              view === k ? 'bg-ink font-semibold text-white' : 'bg-transparent font-medium text-label'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'list' ? list : map}
    </>
  )
}
