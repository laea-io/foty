import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/icon'
import { Avatar, Badge, Photo, StepNo, Verified } from '@/components/ui/primitives'
import type { Host } from '@/lib/demo/people'
import type { Stop } from '@/lib/demo/themes'

/** 장소 카드 목록(번호 · 이름 · 고정 · 시간·체류·종류·확인 시점·출처 · 다음 장소까지 · 사진) */
export function StopList({ stops, className }: { stops: Stop[]; className?: string }) {
  return (
    <div className={className}>
      {stops.map((s, i) => (
        <div key={s.name} className={`flex items-center gap-3.5 py-3.5 ${i ? 'border-t border-line' : ''}`}>
          <StepNo n={i + 1} />
          <div className="min-w-0 grow">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold tracking-[-0.02em]">{s.name}</span>
              {s.fixed && <Badge tone="ink">고정</Badge>}
            </div>
            <div className="mt-0.5 text-[12px] text-sub">
              {s.time} · {s.stay} · {s.kind} ·{' '}
              {s.checked ? `${s.checked} 확인` : <span className="font-semibold text-warn">재확인 필요</span>}{' '}
              ·{' '}
              <a href="#source" className="text-inherit">
                출처
              </a>
            </div>
            {s.next && <div className="mt-0.5 text-[11px] text-muted">다음 장소까지 {s.next}</div>}
          </div>
          <Photo
            src={s.image.src}
            alt={s.image.alt}
            bg={s.image.bg}
            className="h-[52px] w-[52px] rounded-[14px]"
          />
        </div>
      ))}
    </div>
  )
}

/**
 * 코스 약도. 실제 지도가 아니라 장소 순서를 보여 주는 그림이다
 * (지도 연동 전 — 실시간 지도라고 표현하지 않는다).
 */
export function MapSketch({
  count,
  height = 260,
  className,
}: {
  count: number
  height?: number
  className?: string
}) {
  const pts = [
    [110, 70],
    [240, 130],
    [390, 180],
    [460, 110],
  ].slice(0, Math.max(1, Math.min(4, count)))
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] bg-[#e6eaec] ${className ?? ''}`}
      style={{ height }}
    >
      <svg
        viewBox="0 0 520 260"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="block h-full w-full"
      >
        <path
          d="M-10 195C120 182 200 117 280 99S420 52 540 68"
          fill="none"
          stroke="#ffffff"
          strokeWidth="14"
        />
        <path d="M300 270C330 195 400 161 540 156V270z" fill="#d5dde3" />
        <path
          d={`M${pts.map((p) => p.join(' ')).join('L')}`}
          fill="none"
          stroke="#0b0d12"
          strokeWidth="2.5"
          strokeDasharray="1 8"
          strokeLinecap="round"
        />
        {pts.map(([x, y], i) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="14" fill="#0b0d12" />
            <text x={x} y={y + 5} fill="#ffffff" fontSize="13" fontWeight="600" textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/** 집결·포함·제외·취소 같은 표 */
export function InfoRows({ rows, wide }: { rows: [string, ReactNode][]; wide?: boolean }) {
  return (
    <div className="border-t border-line">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`flex ${wide ? 'gap-4 py-4' : 'gap-3 py-[15px]'} ${i ? 'border-t border-line' : ''}`}
        >
          <span className={`flex-none text-sub ${wide ? 'w-20 text-[15px]' : 'w-16 text-[14px]'}`}>{k}</span>
          <span
            className={`min-w-0 grow ${wide ? 'text-[15px] leading-[23px]' : 'text-[14px] leading-[21px]'}`}
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  )
}

/** 상세의 호스트 블록 */
export function HostBlock({ host, wide }: { host: Host; wide?: boolean }) {
  return (
    <div>
      <Link
        href={`/hosts/${host.id}`}
        className={`flex items-center text-ink no-underline ${wide ? 'gap-3.5' : 'gap-3'}`}
      >
        <Avatar name={host.name} size={wide ? 56 : 48} />
        <div className="grow">
          <div className={`font-bold ${wide ? 'text-[17px]' : 'text-[15px]'}`}>{host.name}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <Verified kind={host.kind} />
            <span className="text-[11px] text-muted">진행한 테마 {host.hosted}회</span>
          </div>
        </div>
        {!wide && <Icon name="chevron" size={18} className="text-muted" />}
      </Link>
      <p
        className={`mb-0 text-[#2a2d34] ${wide ? 'mt-3.5 text-[16px] leading-[26px]' : 'mt-3 text-[15px] leading-6'}`}
      >
        {host.intro}
      </p>
    </div>
  )
}

/** 상세의 섹션 머리(호스트 · 코스) */
export function DetailHead({ title, aside, first }: { title: string; aside?: ReactNode; first?: boolean }) {
  return (
    <div className={`mb-3 flex items-baseline justify-between ${first ? '' : 'mt-[34px]'}`}>
      <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">{title}</h2>
      {aside && <span className="text-[12px] text-sub">{aside}</span>}
    </div>
  )
}

/** "4곳 · 5시간" */
export function courseLength(stops: Stop[], start: string, end: string) {
  const h = (s: string) => Number(s.slice(0, 2)) + Number(s.slice(3)) / 60
  const first = stops[0]?.time ?? start
  return `${stops.length}곳 · ${Math.round(h(end) - h(first))}시간`
}
