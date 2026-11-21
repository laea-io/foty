'use client'

import { useState } from 'react'
import { week } from '@/lib/demo/themes'

/** 7일 날짜 고르기(홈 달력과 같은 모양) */
export function DayStrip({ defaultDay = 21 }: { defaultDay?: number }) {
  const [day, setDay] = useState(defaultDay)
  return (
    <div className="flex gap-1">
      {week.map((w) => {
        const on = w.day === day
        return (
          <button
            key={w.day}
            type="button"
            aria-pressed={on}
            onClick={() => setDay(w.day)}
            className={`flex h-[58px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[14px] border-0 ${on ? 'bg-ink' : 'bg-face'}`}
          >
            <span className={`text-[11px] ${on ? 'text-white/70' : 'text-muted'}`}>{w.dow}</span>
            <span className={`text-[16px] font-bold ${on ? 'text-white' : 'text-ink'}`}>{w.day}</span>
          </button>
        )
      })}
    </div>
  )
}
