import Link from 'next/link'
import type { ReactNode } from 'react'
import { ThemeRow } from '@/components/theme/cards'
import { Mascot, type MascotTone } from '@/components/ui/mascot'
import { Badge } from '@/components/ui/primitives'
import type { Theme } from '@/lib/demo/themes'
import type { OtherDate } from '@/lib/server/q/b-themes'

/** 결과 화면 머리: 마스코트 72px + 큰 제목 + 설명(신청 완료 · 성사 · 취소 완료 · 초대) */
export function ResultHead({
  title,
  children,
  tone = 'orange',
}: {
  title: string
  children: ReactNode
  tone?: MascotTone
}) {
  return (
    <div className="flex flex-col items-center pt-12 pb-7 text-center">
      <Mascot size={72} tone={tone} />
      <h1 className="mt-[22px] mb-0 text-[24px] leading-8 font-extrabold tracking-[-0.04em]">{title}</h1>
      <div className="mt-2 text-[14px] leading-[21px] text-sub">{children}</div>
    </div>
  )
}

/** 상태 화면 머리: 회색 배지 + 제목 + 설명(거절 · 호스트 취소) */
export function StatusHead({
  badge,
  title,
  children,
}: {
  badge: string
  title: ReactNode
  children: ReactNode
}) {
  return (
    <div className="pt-7">
      <Badge tone="muted">{badge}</Badge>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">{title}</h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">{children}</div>
    </div>
  )
}

/** 섹션 머리(18px) — 상태별 화면은 위 30px */
export function SectionHead({
  title,
  aside,
  className,
}: {
  title: string
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-3 flex items-baseline justify-between ${className ?? 'mt-[30px]'}`}>
      <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">{title}</h2>
      {aside}
    </div>
  )
}

/** 같은 테마의 다른 날짜 목록 */
export function OtherDateRows({
  dates,
  wide,
  firstBorder = true,
}: {
  dates: OtherDate[]
  wide?: boolean
  firstBorder?: boolean
}) {
  return (
    <div>
      {dates.map((d, i) => (
        <Link
          key={d.id}
          href={`/themes/${d.id}`}
          className={`flex items-center gap-3 text-ink no-underline ${wide ? 'py-4' : 'py-[15px]'} ${
            i || firstBorder ? 'border-t border-line' : ''
          }`}
        >
          <span className="grow">
            <span className={`block font-semibold ${wide ? 'text-[16px]' : 'text-[15px]'}`}>{d.label}</span>
            <span className={`mt-0.5 block text-sub ${wide ? 'text-[13px]' : 'text-[12px]'}`}>
              현재 {d.current}명 · {d.min}명부터 성사
            </span>
          </span>
          <Badge tone={d.badge.tone}>{d.badge.label}</Badge>
        </Link>
      ))}
    </div>
  )
}

/** 테마 목록(모바일 카드 줄) */
export function ThemeList({ list }: { list: Theme[] }) {
  return (
    <div className="-mt-2">
      {list.map((x) => (
        <ThemeRow key={x.id} t={x} />
      ))}
    </div>
  )
}
