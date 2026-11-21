'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { saveCourseAction } from '@/app/actions/c'
import { buttonClass } from '@/components/ui/primitives'
import type { PostView as Post } from '@/lib/server/q/c'

/** 글 카드 아래 버튼: 코스 가져오기 · 이 테마의 다음 날짜 보기 / 질문은 답변하기 */
export function PostActions({ p, size }: { p: Post; size: 'card' | 'wide' }) {
  const [state, copy, pending] = useActionState(saveCourseAction, undefined)
  const cls = (extra = '') =>
    size === 'card'
      ? `${buttonClass('outline', 'sm', extra)} h-[34px] shadow-none`
      : buttonClass('outline', 'sm', extra)
  if (p.kind === '질문')
    return (
      <div className={`flex ${size === 'card' ? 'mt-3.5' : 'mt-4'}`}>
        <Link href={`/community/${p.id}#answer`} className={cls()}>
          답변하기
        </Link>
      </div>
    )
  return (
    <div>
      <div className={`flex ${size === 'card' ? 'mt-3.5 gap-1.5' : 'mt-4 gap-2'}`}>
        {p.coursePlace && p.courseStops.length > 0 && (
          <form action={copy}>
            <input type="hidden" name="place" value={p.coursePlace} />
            <input type="hidden" name="title" value={p.title} />
            <input type="hidden" name="stops" value={p.courseStops.join(',')} />
            <input type="hidden" name="post" value={p.id} />
            <button type="submit" className={cls()} disabled={pending || state?.done} aria-live="polite">
              {state?.done ? '내 코스에 담았어요' : '코스 가져오기'}
            </button>
          </form>
        )}
        {p.themeId && (
          <Link href={`/themes/${p.themeId}`} className={cls()}>
            이 테마의 다음 날짜 보기
          </Link>
        )}
      </div>
      {state?.error && <div className="mt-2 text-[12px] text-warn">{state.error}</div>}
    </div>
  )
}
