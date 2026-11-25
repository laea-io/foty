'use client'

import { type ComponentProps, type ReactNode, useState } from 'react'

/** 폼 칸 제목(14px) + 선택 표시 */
export function FieldLabel({
  children,
  optional,
  htmlFor,
}: {
  children: ReactNode
  optional?: boolean
  htmlFor?: string
}) {
  return (
    <label htmlFor={htmlFor} className="mt-[26px] mb-2.5 block text-[14px] font-semibold">
      {children}
      {optional && <span className="font-normal text-muted"> 선택</span>}
    </label>
  )
}

/** 회색 입력칸(50px) */
export function TextInput({ className, ...rest }: ComponentProps<'input'>) {
  return (
    <input
      className={`h-[50px] w-full rounded-[14px] border-0 bg-face px-4 text-[15px] text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink ${className ?? ''}`}
      {...rest}
    />
  )
}

/** 회색 여러 줄 입력칸 */
export function TextArea({ className, rows = 4, ...rest }: ComponentProps<'textarea'>) {
  return (
    <textarea
      rows={rows}
      className={`w-full resize-none rounded-[14px] border-0 bg-face px-4 py-3.5 text-[15px] leading-[23px] text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink ${className ?? ''}`}
      {...rest}
    />
  )
}

/** 켜고 끄기 줄(제목 · 설명 · 스위치) */
export function SwitchRow({
  title,
  desc,
  defaultOn = true,
  name,
}: {
  title: string
  desc?: string
  defaultOn?: boolean
  /** 폼으로 보낼 때: 켜져 있으면 'on' */
  name?: string
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center gap-3 border-t border-line py-4">
      {name && <input type="hidden" name={name} value={on ? 'on' : ''} />}
      <div className="grow">
        <div className="text-[15px] font-semibold">{title}</div>
        {desc && <div className="mt-0.5 text-[12px] text-sub">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={() => setOn(!on)}
        className={`relative h-7 w-[46px] flex-none rounded-full border-0 transition-colors ${on ? 'bg-ink' : 'bg-line-2'}`}
      >
        <span
          className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all ${on ? 'right-[3px]' : 'right-[21px]'}`}
        />
      </button>
    </div>
  )
}

/** 하나만 고르는 칩 묶음 */
export function ChipGroup({
  options,
  defaultValue,
  multiple,
  name,
  onChange,
}: {
  options: string[]
  defaultValue?: string | string[]
  multiple?: boolean
  /** 폼으로 보낼 때(여럿이면 쉼표로) */
  name?: string
  onChange?: (v: string[]) => void
}) {
  const init = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
  const [sel, setSel] = useState<string[]>(init)
  const toggle = (o: string) => {
    const next = multiple ? (sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]) : [o]
    setSel(next)
    onChange?.(next)
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {name && <input type="hidden" name={name} value={sel.join(',')} />}
      {options.map((o) => {
        const on = sel.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o)}
            className={`inline-flex h-11 flex-none items-center whitespace-nowrap rounded-full border-0 px-4 text-[15px] ${
              on ? 'bg-ink font-semibold text-white' : 'bg-face font-medium text-label'
            }`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

/** 호스트 폼의 칸(13px 제목 + 입력) */
export function Field({
  label,
  children,
  htmlFor,
}: {
  label: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold">
        {label}
      </label>
      {children}
    </div>
  )
}

/** − 3명 + 숫자 고르기 */
export function Stepper({
  label,
  value,
  min = 1,
  max = 12,
  unit = '명',
  name,
}: {
  label: string
  value: number
  min?: number
  max?: number
  unit?: string
  name?: string
}) {
  const [n, setN] = useState(value)
  const btn = 'h-[34px] w-[34px] rounded-full border-0 bg-white text-[16px] disabled:opacity-40'
  return (
    <div className="flex-1">
      {name && <input type="hidden" name={name} value={n} />}
      <div className="mb-1.5 text-[12px] text-sub">{label}</div>
      <div className="flex h-[50px] items-center justify-between rounded-[14px] bg-face px-2">
        <button
          type="button"
          aria-label={`${label} 줄이기`}
          className={btn}
          disabled={n <= min}
          onClick={() => setN(n - 1)}
        >
          −
        </button>
        <b className="text-[15px]" aria-live="polite">
          {n}
          {unit}
        </b>
        <button
          type="button"
          aria-label={`${label} 늘리기`}
          className={btn}
          disabled={n >= max}
          onClick={() => setN(n + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
