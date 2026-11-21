import type { ReactNode } from 'react'

// 그룹 A 화면에서 같이 쓰는 작은 부품(입력칸 · 제목 · 데스크톱 좁은 본문).

/** 라벨 + 회색 입력칸(50px) */
export function Field({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-[50px] w-full rounded-[14px] border-0 bg-face px-4 text-[15px] text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-ink"
      />
    </label>
  )
}

/** 화면 큰 제목(22px) + 보조 설명 */
export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">{children}</h1>
      {sub && <div className="mt-1.5 text-[13px] leading-5 text-sub">{sub}</div>}
    </>
  )
}

/** 데스크톱의 좁은 본문(가운데 600px) + 위 작은 제목 */
export function Narrow({
  eyebrow,
  children,
  width = 600,
}: {
  eyebrow?: string
  children: ReactNode
  width?: number
}) {
  return (
    <div className="mx-auto" style={{ maxWidth: width }}>
      {eyebrow && <div className="mb-2 text-[14px] text-sub">{eyebrow}</div>}
      {children}
    </div>
  )
}

/** 본문 안 섹션 제목(18px) — margin 28px 0 12px */
export function H2({ children, aside, first }: { children: ReactNode; aside?: ReactNode; first?: boolean }) {
  return (
    <div className={`mb-3 flex items-baseline justify-between ${first ? '' : 'mt-7'}`}>
      <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">{children}</h2>
      {aside && <span className="text-[12px] text-sub">{aside}</span>}
    </div>
  )
}
