import type { ReactNode } from 'react'
import { ChipPick } from './chip-pick'

/** 가입 단계 점(현재 칸만 길게) */
export function StepDots({ step, total = 3, wide }: { step: number; total?: number; wide?: boolean }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: 칸 위치가 곧 의미
          key={i}
          className={`block h-1.5 rounded-[3px] ${i === step ? 'bg-ink' : 'bg-line'}`}
          style={{ width: i === step ? (wide ? 28 : step === 0 ? 18 : 22) : wide ? 8 : 6 }}
        />
      ))}
    </div>
  )
}

/** 칩 묶음 + 작은 제목 */
export function PickGroup({
  title,
  options,
  initial,
  multi,
  small,
}: {
  title: string
  options: string[]
  initial: string[]
  multi?: boolean
  /** 작은 제목 13px·mb-10 / 칩 간격 8 (첫 화면) — 아니면 14px·margin 26px 0 10px / 간격 6 */
  small?: boolean
}) {
  return small ? (
    <div>
      <div className="mb-2.5 text-[13px] font-semibold">{title}</div>
      <ChipPick label={title} options={options} initial={initial} multi={multi} />
    </div>
  ) : (
    <>
      <div className="mt-[26px] mb-2.5 text-[14px] font-semibold">{title}</div>
      <ChipPick label={title} options={options} initial={initial} multi={multi} gap={6} />
    </>
  )
}

export function Stack({
  gap,
  className,
  children,
}: {
  gap: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex flex-col ${className ?? ''}`} style={{ gap }}>
      {children}
    </div>
  )
}
