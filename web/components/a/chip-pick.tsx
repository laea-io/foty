'use client'

import { useState } from 'react'
import { Chip } from '@/components/ui/primitives'

/** 칩 고르기. multi면 여러 개, 아니면 하나만(다시 누르면 그대로). */
export function ChipPick({
  options,
  initial = [],
  multi,
  label,
  gap = 8,
}: {
  options: string[]
  initial?: string[]
  multi?: boolean
  label: string
  gap?: number
}) {
  const [picked, setPicked] = useState<string[]>(initial)
  const toggle = (o: string) =>
    setPicked((cur) => (multi ? (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]) : [o]))
  return (
    // biome-ignore lint/a11y/useSemanticElements: 칩 묶음 — fieldset 기본 모양을 피한다
    <div role="group" aria-label={label} className="flex flex-wrap" style={{ gap }}>
      {options.map((o) => (
        <Chip key={o} selected={picked.includes(o)} onClick={() => toggle(o)}>
          {o}
        </Chip>
      ))}
    </div>
  )
}

/** MBTI 16칸 + 잘 모르겠어요 */
export function MbtiPick({ initial }: { initial?: string }) {
  const types = [
    'ISTJ',
    'ISFJ',
    'INFJ',
    'INTJ',
    'ISTP',
    'ISFP',
    'INFP',
    'INTP',
    'ESTP',
    'ESFP',
    'ENFP',
    'ENTP',
    'ESTJ',
    'ESFJ',
    'ENFJ',
    'ENTJ',
  ]
  const [v, setV] = useState<string | null>(initial ?? null)
  return (
    <>
      <div className="mt-6 grid grid-cols-4 gap-1.5">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={v === t}
            onClick={() => setV(v === t ? null : t)}
            className={`h-12 rounded-[14px] border-0 text-[14px] font-semibold ${v === t ? 'bg-ink text-white' : 'bg-face text-label'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <button
          type="button"
          aria-pressed={v === '?'}
          onClick={() => setV('?')}
          className={`flex h-12 w-full items-center justify-center rounded-[14px] border-0 text-[15px] font-semibold ${v === '?' ? 'bg-ink text-white' : 'bg-face text-ink'}`}
        >
          잘 모르겠어요
        </button>
      </div>
    </>
  )
}
