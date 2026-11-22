import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { Icon, type IconName } from './icon'

// ── 버튼 ─────────────────────────────────────────────
// 디자인의 버튼 네 가지: 검정(주요) · 주황(강조, 한 화면에 한 곳) · 테두리 · 면(회색)
type Variant = 'primary' | 'accent' | 'outline' | 'soft'
type Size = 'lg' | 'md' | 'sm' // 54 · 50 · 44px

const variantCls: Record<Variant, string> = {
  primary: 'bg-ink text-white',
  accent: 'bg-accent text-white',
  outline: 'bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line-2)]',
  soft: 'bg-face text-ink',
}
const sizeCls: Record<Size, string> = {
  lg: 'h-[54px] rounded-[14px] text-[15px]',
  md: 'h-[50px] rounded-[14px] text-[15px]',
  sm: 'h-11 rounded-[12px] text-[13px]',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-1.5 whitespace-nowrap border-0 px-[18px] font-semibold no-underline disabled:opacity-40 ${variantCls[variant]} ${sizeCls[size]} ${extra}`
}

type BtnBase = { variant?: Variant; size?: Size; icon?: IconName; block?: boolean; children: ReactNode }

export function Button({
  variant,
  size,
  icon,
  block,
  className,
  children,
  ...rest
}: BtnBase & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={buttonClass(variant, size, `${block ? 'w-full' : ''} ${className ?? ''}`)}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} weight={1.8} />}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant,
  size,
  icon,
  block,
  className,
  children,
  ...rest
}: BtnBase & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, `${block ? 'w-full' : ''} ${className ?? ''}`)} {...rest}>
      {icon && <Icon name={icon} size={16} weight={1.8} />}
      {children}
    </Link>
  )
}

// ── 선택 칩 ──────────────────────────────────────────
export function Chip({
  selected,
  icon,
  className,
  children,
  ...rest
}: { selected?: boolean; icon?: IconName; children: ReactNode } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-11 flex-none items-center gap-[5px] whitespace-nowrap rounded-full border-0 px-4 text-[15px] ${
        selected ? 'bg-ink font-semibold text-white' : 'bg-face font-medium text-label'
      } ${className ?? ''}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} weight={1.8} />}
      {children}
    </button>
  )
}

// ── 상태 배지 ────────────────────────────────────────
// ink: 확정된 상태(성사·수락·고정) · soft: 진행 중(모집 중·조율 중) · muted: 끝/꺼짐(취소·거절) · warn: 사람의 행동이 필요(성사까지 n명·확인 대기)
export type BadgeTone = 'ink' | 'soft' | 'muted' | 'warn'
const badgeCls: Record<BadgeTone, string> = {
  ink: 'bg-ink text-white',
  soft: 'bg-face text-ink',
  muted: 'bg-face text-sub',
  warn: 'bg-warn-bg text-warn',
}
export function Badge({ tone = 'soft', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-[9px] text-[11px] font-semibold ${badgeCls[tone]}`}
    >
      {children}
    </span>
  )
}

/** 동행 기록의 행동 태그(“시간을 잘 지켜요”) */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-face px-[9px] text-[11px] text-label">
      {children}
    </span>
  )
}

// ── 아바타(글자) ────────────────────────────────────
export function Avatar({ name, size = 40, ring = true }: { name: string; size?: number; ring?: boolean }) {
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex flex-none items-center justify-center rounded-full bg-avatar font-semibold text-sub ${
        ring ? 'border-[1.5px] border-white' : ''
      }`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

export function AvatarStack({ names, size = 28 }: { names: string[]; size?: number }) {
  return (
    <span className="flex">
      {names.map((n, i) => (
        <span key={n} className="inline-flex" style={{ marginLeft: i ? -8 : 0 }}>
          <Avatar name={n} size={size} />
        </span>
      ))}
    </span>
  )
}

// ── 성사 진행 표시 ──────────────────────────────────
export function Progress({
  current,
  max,
  min,
  deadline,
  deadlinePrefix = '마감',
}: {
  current: number
  max: number
  min: number
  deadline?: string
  deadlinePrefix?: string
}) {
  return (
    <div>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 칸 위치가 곧 의미
          <span key={i} className={`h-1.5 flex-1 rounded-[3px] ${i < current ? 'bg-ink' : 'bg-line-2'}`} />
        ))}
      </div>
      <div className="mt-[7px] flex justify-between text-[12px] text-sub">
        <span>
          현재 {current}명 · {min}명부터 성사
        </span>
        <span>{deadline ? `${deadlinePrefix} ${deadline}` : ''}</span>
      </div>
    </div>
  )
}

// ── 호스트 인증 표시 · 추천 이유 ────────────────────
export function Verified({ kind }: { kind: 'business' | 'resident' }) {
  return (
    <span className="inline-flex items-center gap-[3px] text-[11px] text-sub">
      <Icon name="check" size={12} weight={2} />
      {kind === 'business' ? '사업장 확인' : '남양주 주민 인증'}
    </span>
  )
}

export function Reason({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-[13px] text-sub ${className ?? ''}`}>
      <Icon name="sparkle" size={16} className="text-accent" weight={1.8} />
      {children}
    </div>
  )
}

// ── 사진 ─────────────────────────────────────────────
export function Photo({
  src,
  alt,
  className,
  bg = '#e6e1d8',
}: {
  src: string
  alt: string
  className?: string
  bg?: string
}) {
  return (
    <div className={`flex-none overflow-hidden ${className ?? ''}`} style={{ background: bg }}>
      {/* biome-ignore lint/performance/noImgElement: standalone에 sharp를 넣지 않는다 — 사진은 미리 줄여 둔다 */}
      <img src={src} alt={alt} className="block h-full w-full object-cover" loading="lazy" />
    </div>
  )
}

// ── 시연 데이터 표시 ────────────────────────────────
export function DemoNote({ className }: { className?: string }) {
  return (
    <div className={`pt-6 text-center text-[11px] text-muted ${className ?? ''}`}>
      장소 사진·정보 한국관광공사 ·{' '}
      <a href="/credits" className="text-muted underline">
        사진 출처
      </a>
    </div>
  )
}

// ── 세그먼트 탭(일정·대화·참여자 등) ─────────────────
export function Segmented({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav className="flex rounded-full bg-face p-1">
      {items.map((it) => {
        const on = it.href === current
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? 'page' : undefined}
            className={`flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-full text-[13px] no-underline ${
              on ? 'bg-ink font-semibold text-white' : 'font-medium text-label'
            }`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** 큰 글자 탭(이번 주말 테마 · 다음 주 · 전체) */
export function TextTabs({
  items,
  current,
  size = 19,
}: {
  items: { href: string; label: string }[]
  current: string
  size?: number
}) {
  return (
    <div className="flex items-baseline gap-[18px] overflow-hidden whitespace-nowrap">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.href === current ? 'page' : undefined}
          className={`no-underline tracking-[-0.04em] ${it.href === current ? 'font-extrabold text-ink' : 'font-medium text-faint'}`}
          style={{ fontSize: size }}
        >
          {it.label}
        </Link>
      ))}
    </div>
  )
}

/** 동그란 아이콘 버튼(44px 터치 영역) */
export function IconButton({
  icon,
  label,
  href,
  dot,
  onClick,
  color,
}: {
  icon: IconName
  label: string
  href?: string
  dot?: boolean
  onClick?: () => void
  color?: string
}) {
  const inner = (
    <>
      <Icon name={icon} className={color} />
      {dot && <span className="absolute top-[11px] right-[11px] h-1.5 w-1.5 rounded-full bg-accent" />}
    </>
  )
  const cls = 'relative flex h-11 w-11 items-center justify-center border-0 bg-transparent p-0 no-underline'
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" aria-label={label} className={cls} onClick={onClick}>
      {inner}
    </button>
  )
}

/** 섹션 제목(17px 굵게) + 오른쪽 보조 */
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="m-0 text-[17px] font-extrabold tracking-[-0.03em]">{children}</h2>
      {aside}
    </div>
  )
}

/** 작은 안내(12px 회색) */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`text-[12px] leading-[18px] text-muted ${className ?? ''}`}>{children}</div>
}

/** 장소 번호 동그라미 */
export function StepNo({ n }: { n: number | string }) {
  return (
    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
      {n}
    </span>
  )
}
