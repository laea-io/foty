'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShareButton } from '@/components/theme/share-button'
import { Icon } from '@/components/ui/icon'
import { Button, Chip, Note } from '@/components/ui/primitives'

/** 코스 아래 버튼 줄: AI에게 바꿔 달라고 하기 · 저장 (· 데스크톱은 공유) */
export function CourseActions({ title, wide }: { title: string; wide?: boolean }) {
  const [ai, setAi] = useState(false)
  const [saved, setSaved] = useState(false)
  const [asked, setAsked] = useState<string | null>(null)
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
        <Button className="h-12" onClick={() => setSaved(!saved)} aria-pressed={saved}>
          {saved ? '저장됨' : '저장'}
        </Button>
        {wide && <ShareButton title={title} wide className="h-12" />}
      </div>
      {saved && (
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
            {['카페 한 곳 더', '덜 걷는 코스로', '실내 장소로', '예산 줄이기'].map((c) => (
              <Chip key={c} selected={asked === c} onClick={() => setAsked(c)} className="bg-white">
                {c}
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-1.5 text-[12px] leading-[18px] text-sub">
            <Icon name="sparkle" size={14} className="mt-0.5 text-accent" />
            {asked
              ? `“${asked}” 요청을 받았어요. 고정한 핵심 장소는 그대로 두고 나머지 구간만 바꿔서 제안해요.`
              : '고정한 핵심 장소는 바뀌지 않아요. 나머지 구간만 바꿔서 제안해요.'}
          </div>
        </div>
      )}
    </div>
  )
}
