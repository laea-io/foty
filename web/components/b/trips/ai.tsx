'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { buttonClass, Chip, Photo } from '@/components/ui/primitives'
import { aiChips, aiSuggestions } from '@/lib/demo/trips'

/** AI 도우미 입력줄. 보내면(시연) “확인된 곳을 찾지 못했어요” 화면으로 */
export function AiInput({ id, wide }: { id: string; wide?: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    router.push(`/trips/${id}/ai/unknown?q=${encodeURIComponent(q.trim())}`)
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

/** AI 도우미 대화(빠른 요청 칩 · 내 질문 · 추천 카페 2곳 · 안내) */
export function AiThread({ id, wide }: { id: string; wide?: boolean }) {
  const [chips, setChips] = useState<string[]>([])
  const [sent, setSent] = useState<string[]>([])
  const toggle = (c: string) => setChips(chips.includes(c) ? chips.filter((x) => x !== c) : [...chips, c])
  return (
    <>
      <div className={`flex flex-wrap gap-1.5 ${wide ? 'mt-3' : ''}`}>
        {aiChips.map((c) => (
          <Chip key={c} selected={chips.includes(c)} onClick={() => toggle(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <div className={`flex justify-end ${wide ? 'mt-[22px]' : ''}`}>
        <div className="rounded-[16px_16px_4px_16px] bg-ink px-3.5 py-2.5 text-[15px] text-white">
          카페 한 곳 더 찾아줘
        </div>
      </div>
      <div>
        <div className={`flex items-center gap-2 text-[15px] font-semibold ${wide ? 'mt-[22px]' : ''}`}>
          <Mascot size={28} tone="ink" />
          코스 근처 카페 2곳이에요
        </div>
        <div className="mt-1.5">
          {aiSuggestions.map((s, i) => {
            const done = sent.includes(s.name)
            return (
              <div key={s.name} className={`flex items-center gap-3 py-3 ${i ? 'border-t border-line' : ''}`}>
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
                {wide ? (
                  <button
                    type="button"
                    aria-pressed={done}
                    onClick={() => setSent(done ? sent.filter((x) => x !== s.name) : [...sent, s.name])}
                    className={buttonClass('soft', 'sm')}
                  >
                    {done ? '제안했어요' : '코스에 제안'}
                  </button>
                ) : (
                  <Link href={`/trips/${id}`} className={buttonClass('soft', 'sm')}>
                    코스에 제안
                  </Link>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 text-[12px] leading-[18px] text-muted">
          11월 19일 확인한 정보예요. 핵심 장소 광릉숲은 바뀌지 않아요. 제안은 참여자 모두가 확인해야 일정에
          반영돼요.
        </div>
      </div>
    </>
  )
}
