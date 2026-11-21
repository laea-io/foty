'use client'

import Link from 'next/link'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/primitives'
import type { Post } from '@/lib/demo/community'

/** 글 카드 아래 버튼: 코스 가져오기 · 이 테마의 다음 날짜 보기 / 질문은 답변하기 */
export function PostActions({ p, size }: { p: Post; size: 'card' | 'wide' }) {
  const [copied, setCopied] = useState(false)
  const cls = (extra = '') =>
    size === 'card'
      ? `${buttonClass('outline', 'sm', extra)} h-[34px] shadow-none`
      : buttonClass('outline', 'sm', extra)
  if (p.kind === '질문')
    return (
      <div className={`flex ${size === 'card' ? 'mt-3.5' : 'mt-4'}`}>
        <Link href={`/community/${p.id}`} className={cls()}>
          답변하기
        </Link>
      </div>
    )
  return (
    <div className={`flex ${size === 'card' ? 'mt-3.5 gap-1.5' : 'mt-4 gap-2'}`}>
      <button type="button" className={cls()} onClick={() => setCopied(true)} aria-live="polite">
        {copied ? '내 코스에 담았어요' : '코스 가져오기'}
      </button>
      {p.themeId && (
        <Link href={`/themes/${p.themeId}`} className={cls()}>
          이 테마의 다음 날짜 보기
        </Link>
      )}
    </div>
  )
}
