'use client'

import { useState } from 'react'

export type StripDay = { iso: string; day: number; dow: string; disabled?: boolean }

/** 7일 날짜 고르기(홈 달력과 같은 모양). name이 있으면 고른 날(YYYY-MM-DD)을 폼으로 보낸다 */
export function DayStrip({
  days,
  value,
  name,
  max,
}: {
  days: StripDay[]
  value?: string
  name?: string
  /** 있으면 7일 밖의 날짜를 달력으로 고를 수 있다(YYYY-MM-DD까지) */
  max?: string
}) {
  const first = days.find((d) => !d.disabled)?.iso
  const [day, setDay] = useState(value && (!first || value >= first) ? value : first)
  const inStrip = days.some((d) => d.iso === day)
  return (
    <div>
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
      {max && first && (
        <label className="mt-2 flex h-11 items-center gap-2 rounded-[12px] bg-face px-4 text-[14px] text-sub">
          <span className="flex-none">{inStrip ? '다른 날 고르기' : '고른 날'}</span>
          <input
            type="date"
            min={first}
            max={max}
            value={inStrip ? '' : (day ?? '')}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            aria-label="다른 날 고르기"
            className="min-w-0 grow border-0 bg-transparent text-right text-[15px] text-ink outline-none"
          />
        </label>
      )}
    </div>
  )
}
