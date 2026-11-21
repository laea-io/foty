'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'
import { saveCourseAction } from '@/app/actions/c'
import { ShareButton } from '@/components/theme/share-button'
import { Icon } from '@/components/ui/icon'
import { Button, Chip, Note } from '@/components/ui/primitives'
import type { CourseData } from '@/lib/server/q/c'

const asks = ['카페 한 곳 더', '덜 걷는 코스로', '실내 장소로', '예산 줄이기']

/** 코스 아래 버튼 줄: AI에게 바꿔 달라고 하기(검토된 장소로 다시 짜기) · 저장 (· 데스크톱은 공유) */
export function CourseActions({ title, c, wide }: { title: string; c: CourseData; wide?: boolean }) {
  const router = useRouter()
  const [ai, setAi] = useState(!!c.ask)
  const [state, save, saving] = useActionState(saveCourseAction, undefined)
  const pick = (a: string) =>
    router.replace(`?place=${c.place.id}${a === c.ask ? '' : `&ask=${encodeURIComponent(a)}`}`, {
      scroll: false,
    })
  return (
    <div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          icon="sparkle"
          className="h-12 grow"
          onClick={() => setAi(!ai)}
          aria-expanded={ai}
        >
          AI에게 바꿔 달라고 하기
        </Button>
        <form action={save}>
          <input type="hidden" name="place" value={c.place.id} />
          <input type="hidden" name="title" value={title} />
          <input type="hidden" name="stops" value={c.placeIds.join(',')} />
          <Button type="submit" className="h-12" disabled={saving || state?.done}>
            {state?.done ? '저장됨' : '저장'}
          </Button>
        </form>
        {wide && <ShareButton title={title} wide className="h-12" />}
      </div>
      {state?.error && <div className="mt-2 text-[13px] text-warn">{state.error}</div>}
      {state?.done && (
        <Note className="mt-2">
          저장했어요.{' '}
          <Link href="/course/saved" className="font-semibold text-ink">
            저장한 코스 보기
          </Link>
        </Note>
      )}
      {ai && (
        <div className="mt-3 rounded-[16px] bg-face p-4">
          <div className="flex flex-wrap gap-1.5">
            {asks.map((a) => (
              <Chip key={a} selected={c.ask === a} onClick={() => pick(a)} className="bg-white">
                {a}
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-1.5 text-[12px] leading-[18px] text-sub">
            <Icon name="sparkle" size={14} className="mt-0.5 text-accent" />
            {c.ask
              ? `“${c.ask}” 요청으로 다시 짰어요. 고정한 핵심 장소는 그대로예요. 검토된 장소 목록에서만 골라요.`
              : '고정한 핵심 장소는 바뀌지 않아요. 나머지 구간만 검토된 장소 목록에서 다시 골라요.'}
          </div>
        </div>
      )}
    </div>
  )
}
