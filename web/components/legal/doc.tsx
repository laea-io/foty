// 이용약관 · 개인정보 처리 방침 · 고객센터 공통 틀 — 로그인하지 않아도 열린다(proxy OPEN)
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { PageTitle } from '@/components/ui/parts'

const EFFECTIVE = '2026-11-22'

export type Section = { title: string; body: ReactNode[] }

/** 맨 위 시행일 · 초안 안내 */
function DraftLine() {
  return (
    <div className="mt-3 rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[12px] leading-[18px] font-semibold text-warn">
      시행일 {EFFECTIVE} · 초안 — 정식 공개 전 법률 검토가 필요해요
    </div>
  )
}

const LINKS = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보 처리 방침' },
  { href: '/support', label: '고객센터' },
]

/** 세 문서 사이를 오가는 링크 */
export function LegalLinks({ current, className }: { current?: string; className?: string }) {
  return (
    <nav
      className={`flex flex-wrap justify-center gap-x-3.5 gap-y-1 text-[12px] text-muted ${className ?? ''}`}
    >
      {LINKS.map((l, i) => (
        <span key={l.href} className="flex gap-3.5">
          {i > 0 && <span className="text-line">|</span>}
          <Link
            href={l.href}
            aria-current={current === l.href ? 'page' : undefined}
            className={`no-underline ${current === l.href ? 'font-semibold text-ink' : 'text-muted'}`}
          >
            {l.label}
          </Link>
        </span>
      ))}
    </nav>
  )
}

function Sections({ sections }: { sections: Section[] }) {
  return (
    <div className="mt-2">
      {sections.map((s, i) => (
        <section key={s.title} className="border-t border-line py-5 first:border-t-0">
          <h2 className="m-0 text-[16px] font-extrabold tracking-[-0.03em]">
            {i + 1}. {s.title}
          </h2>
          <div className="mt-2 flex flex-col gap-2 text-[14px] leading-[22px] text-[#2a2d34]">
            {s.body.map((b, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: 고정된 문서 문단
              <div key={j}>{b}</div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** 문서 화면: 모바일 BackBar + 본문, 데스크톱 가운데 680px */
export function LegalPage({
  path,
  title,
  sub,
  sections,
  children,
}: {
  path: string
  title: string
  sub?: string
  sections?: Section[]
  /** 섹션 앞에 넣을 내용(고객센터 FAQ 등) */
  children?: ReactNode
}) {
  const body = (
    <>
      <PageTitle sub={sub}>{title}</PageTitle>
      <DraftLine />
      {children}
      {sections && <Sections sections={sections} />}
      <LegalLinks current={path} className="mt-8" />
    </>
  )
  return (
    <>
      <MobileFrame>
        <BackBar title={title} />
        <div className="px-5 pb-12">{body}</div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[680px] pb-10">{body}</div>
      </DesktopFrame>
    </>
  )
}

/** 문단 안 목록 */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
      {items.map((x, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 고정된 목록
        <li key={i}>{x}</li>
      ))}
    </ul>
  )
}
