import Link from 'next/link'
import type { ReactNode } from 'react'
import { Mascot } from '@/components/ui/mascot'
import type { Cell } from '@/lib/shared/stamps'

/** 스탬프 칸(64px 꽃 + 이름 + 아래 줄). 받은 칸은 주황 얼굴, 빈 칸은 연회색 모양만. */
export function StampCell({ c, size = 64 }: { c: Cell; size?: number }) {
  return (
    <Link
      href={c.href}
      className={`flex flex-col items-center py-1.5 text-center no-underline ${c.got ? 'text-ink' : 'text-muted'}`}
    >
      {c.got ? <Mascot size={size} /> : <Mascot size={size} tone="pale" face={false} />}
      <span className="mt-2 text-[13px] font-semibold">{c.name}</span>
      <span className={`mt-0.5 text-[11px] ${c.live ? 'text-ink underline' : 'text-muted'}`}>
        {c.caption}
      </span>
    </Link>
  )
}

/** 권역·시리즈 한 묶음(제목 · 오른쪽 n / m · 칸 격자) */
export function StampGroup({
  title,
  aside,
  cells,
  cols = 3,
  dim,
}: {
  title: ReactNode
  aside: string
  cells: Cell[]
  cols?: number
  dim?: boolean
}) {
  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between">
        <span className={`text-[17px] font-extrabold tracking-[-0.03em] ${dim ? 'text-muted' : ''}`}>
          {title}
        </span>
        <span className="text-[12px] text-sub">{aside}</span>
      </div>
      <div
        className="mt-3 grid gap-x-2 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map((c) => (
          <StampCell key={c.id + c.name} c={c} />
        ))}
      </div>
    </div>
  )
}
