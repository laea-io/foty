'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { ProposeButton } from '@/components/trips/forms'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { Chip, Photo } from '@/components/ui/primitives'

/** 빠른 요청 칩 */
const aiChips = ['덜 걷는 코스로', '실내 장소로', '예산 줄이기']

/** AI가 고른 장소 한 곳(검토된 장소만) */
export type AiPlace = {
  id: string
  name: string
  meta: string
  image: { src: string; alt: string; bg: string }
}

/** AI 도우미 입력줄 — 보내면 ?ask=… 로 다시 묻는다(서버가 검토된 장소에서 찾는다) */
export function AiInput({ id, wide }: { id: string; wide?: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    router.push(`/trips/${id}/ai?ask=${encodeURIComponent(q.trim())}`, { scroll: false })
  }
  return (
    <form onSubmit={send} className={`flex items-center ${wide ? 'gap-2' : 'gap-2.5'}`}>
      <label className="sr-only" htmlFor={`ai-q-${wide ? 'w' : 'm'}`}>
        AI 도우미에게 묻기
      </label>
      <input
        id={`ai-q-${wide ? 'w' : 'm'}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        maxLength={100}
        placeholder="예: 점심 먹을 곳 찾아줘"
        className="h-[46px] min-w-0 grow rounded-full border-0 bg-face px-4 text-[14px] text-ink outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        aria-label="보내기"
        className="flex h-11 w-11 flex-none items-center justify-center border-0 bg-transparent p-0"
      >
        <Icon name="send" />
      </button>
    </form>
  )
}

/** AI 도우미 대화(빠른 요청 칩 · 내 질문 · 찾은 곳 · 안내). 칩을 누르면 그 요청으로 다시 묻는다 */
export function AiThread({
  id,
  ask,
  places,
  heading,
  note,
  wide,
}: {
  id: string
  ask?: string
  places: AiPlace[]
  heading?: string
  note: string
  wide?: boolean
}) {
  const router = useRouter()
  const pick = (c: string) =>
    router.push(ask === c ? `/trips/${id}/ai` : `/trips/${id}/ai?ask=${encodeURIComponent(c)}`, {
      scroll: false,
    })
  return (
    <>
      <div className={`flex flex-wrap gap-1.5 ${wide ? 'mt-3' : ''}`}>
        {aiChips.map((c) => (
          <Chip key={c} selected={ask === c} onClick={() => pick(c)}>
            {c}
          </Chip>
        ))}
      </div>
      {ask && (
        <div className={`flex justify-end ${wide ? 'mt-[22px]' : ''}`}>
          <div className="rounded-[16px_16px_4px_16px] bg-ink px-3.5 py-2.5 text-[15px] text-white">
            {ask}
          </div>
        </div>
      )}
      <div>
        <div className={`flex items-center gap-2 text-[15px] font-semibold ${wide ? 'mt-[22px]' : ''}`}>
          <Mascot size={28} tone="ink" />
          {heading ?? '무엇을 바꿔 볼까요? 칩을 누르거나 물어보세요'}
        </div>
        {places.length > 0 && (
          <div className="mt-1.5">
            {places.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 py-3 ${i ? 'border-t border-line' : ''}`}>
                <Photo
                  src={s.image.src}
                  alt={s.image.alt}
                  bg={s.image.bg}
                  className={`${wide ? 'h-14 w-14' : 'h-[52px] w-[52px]'} rounded-[14px]`}
                />
                <div className="min-w-0 grow">
                  <div className="text-[15px] font-semibold tracking-[-0.02em]">{s.name}</div>
                  <div className="mt-0.5 text-[12px] text-sub">{s.meta}</div>
                </div>
                <ProposeButton themeId={id} placeId={s.id} wide={wide} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 text-[12px] leading-[18px] text-muted">{note}</div>
      </div>
    </>
  )
}
