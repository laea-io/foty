'use client'

import { useState } from 'react'

export type StripDay = { iso: string; day: number; dow: string; disabled?: boolean }

/** 7일 날짜 고르기(홈 달력과 같은 모양). name이 있으면 고른 날(YYYY-MM-DD)을 폼으로 보낸다 */
export function DayStrip({ days, value, name }: { days: StripDay[]; value?: string; name?: string }) {
  const first = days.find((d) => !d.disabled)?.iso
  const [day, setDay] = useState(value && days.some((d) => d.iso === value && !d.disabled) ? value : first)
  return (
    <div className="flex gap-1">
      {name && <input type="hidden" name={name} value={day ?? ''} />}
      {days.map((w) => {
        const on = w.iso === day
        return (
          <button
            key={w.iso}
            type="button"
            aria-pressed={on}
            disabled={w.disabled}
            title={w.disabled ? '모집 마감(전날 18:00)이 지나 고를 수 없어요' : undefined}
            onClick={() => setDay(w.iso)}
            className={`flex h-[58px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[14px] border-0 disabled:opacity-35 ${on ? 'bg-ink' : 'bg-face'}`}
          >
            <span className={`text-[11px] ${on ? 'text-white/70' : 'text-muted'}`}>{w.dow}</span>
            <span className={`text-[16px] font-bold ${on ? 'text-white' : 'text-ink'}`}>{w.day}</span>
          </button>
        )
      })}
    </div>
  )
}
