'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/mascot'
import { Avatar, Badge, IconButton } from '@/components/ui/primitives'
import { useViewerBrief } from './viewer-context'

const guestNav = [
  { href: '/', label: '홈', match: (p: string) => p === '/' || p.startsWith('/themes') },
  { href: '/course', label: '코스', match: (p: string) => p.startsWith('/course') },
  { href: '/community', label: '커뮤니티', match: (p: string) => p.startsWith('/community') },
  { href: '/trips', label: '내 여행', match: (p: string) => p.startsWith('/trips') },
]
const hostNav = [
  { href: '/host', label: '내 테마', match: (p: string) => p === '/host' || p.startsWith('/host/themes') },
  { href: '/host/new', label: '테마 등록', match: (p: string) => p.startsWith('/host/new') },
  { href: '/host/checkin', label: '체크인', match: (p: string) => p.startsWith('/host/checkin') },
  { href: '/host/summary', label: '방문 요약', match: (p: string) => p.startsWith('/host/summary') },
]

/** 데스크톱 상단 메뉴(1024px 이상). /host 아래는 호스트 메뉴로 바뀐다. */
// 로그인 화면은 위아래 틀 없이 전체 화면(DLogin)
const bare = (p: string) => p === '/login'

export function DesktopHeader() {
  const path = usePathname()
  const viewer = useViewerBrief()
  // 로그인 전(로그인·가입·약관)에는 메뉴를 보이지 않는다 — 누를 곳이 모두 로그인 화면이라서
  if (bare(path) || !viewer) return null
  const host = (path === '/host' || path.startsWith('/host/')) && !path.startsWith('/host/join')
  const nav = host ? hostNav : guestNav
  return (
    <header className="hidden border-b border-line lg:block">
      <div className="mx-auto flex h-[68px] max-w-[1184px] items-center gap-9 px-8">
        <Link href={host ? '/host' : '/'} className="inline-flex items-center gap-2 no-underline">
          <Logo />
          {host && <Badge tone="ink">호스트</Badge>}
        </Link>
        <nav className="flex gap-7">
          {nav.map((n) => {
            const on = n.match(path)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? 'page' : undefined}
                className={`text-[15px] no-underline ${on ? 'font-bold text-ink' : 'font-medium text-sub'}`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="grow" />
        <Link href={host ? '/my' : '/host'} className="mr-2 text-[13px] text-sub no-underline">
          {host ? '참여자 화면으로' : '호스트 메뉴'}
        </Link>
        <IconButton icon="search" label="검색" href="/search" />
        <IconButton icon="bell" label="알림" href="/notifications" dot={!!viewer?.unread} />
        <Link href="/my" className="inline-flex">
          <Avatar name={viewer?.name ?? '나'} size={34} />
        </Link>
      </div>
    </header>
  )
}

export function DesktopFooter() {
  const path = usePathname()
  if (bare(path) || path.endsWith('/apply')) return null
  return (
    <footer className="hidden border-t border-line p-7 text-center text-[12px] text-muted lg:block">
      foty · 장소 사진·정보 한국관광공사 ·{' '}
      <Link href="/credits" className="text-muted">
        사진 출처
      </Link>
    </footer>
  )
}
