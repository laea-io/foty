'use client'

import { useState } from 'react'

/** 켜고 끄는 스위치(46×28) */
export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-[46px] flex-none rounded-full border-0 p-0 transition-colors ${on ? 'bg-ink' : 'bg-[#d5d8dd]'}`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-[left] ${on ? 'left-[21px]' : 'left-[3px]'}`}
      />
    </button>
  )
}

/** 제목·설명 + 스위치 한 줄(위 구분선) */
export function ToggleRow({
  title,
  sub,
  defaultOn = false,
  name,
}: {
  title: string
  sub?: string
  defaultOn?: boolean
  /** 폼으로 보낼 이름(켜져 있으면 "on") */
  name?: string
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center gap-3 border-t border-line py-4">
      <div className="grow">
        <div className="text-[15px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 text-[12px] text-sub">{sub}</div>}
      </div>
      <Switch on={on} onChange={setOn} label={title} />
      {name && on && <input type="hidden" name={name} value="on" />}
    </div>
  )
}
