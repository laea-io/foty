'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/icon'
import { Logo } from '@/components/ui/mascot'
import { Badge, IconButton } from '@/components/ui/primitives'

const tabs: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: '/', label: '홈', icon: 'home', match: (p) => p === '/' },
  { href: '/course', label: '코스', icon: 'map', match: (p) => p.startsWith('/course') },
  { href: '/community', label: '커뮤니티', icon: 'chat', match: (p) => p.startsWith('/community') },
  { href: '/trips', label: '내 여행', icon: 'calendar', match: (p) => p.startsWith('/trips') },
  { href: '/my', label: '마이', icon: 'user', match: (p) => p.startsWith('/my') },
]

/** 모바일 하단 메뉴(홈·코스·커뮤니티·내 여행·마이). 이 메뉴가 있는 화면은 MobileFrame tabbar를 켠다. */
export function MobileTabBar() {
  const path = usePathname()
  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[560px] items-start border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{ height: 'calc(76px + env(safe-area-inset-bottom))' }}
    >
      {tabs.map((t) => {
        const on = t.match(path)
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-[3px] pt-[9px] text-[10px] no-underline ${
              on ? 'font-semibold text-ink' : 'font-medium text-muted'
            }`}
          >
            <Icon name={t.icon} />
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** 홈·탭 화면 상단: 로고 + 검색 + 알림 */
export function MobileTopBar({ host }: { host?: boolean }) {
  return (
    <header className="flex h-14 items-center pr-2 pl-5">
      <Link href={host ? '/host' : '/'} className="inline-flex items-center gap-2 no-underline">
        <Logo />
        {host && <Badge tone="ink">호스트</Badge>}
      </Link>
      <div className="grow" />
      {host ? (
        <Link href="/my" className="mr-1 text-[12px] text-sub no-underline">
          참여자 화면으로
        </Link>
      ) : (
        <IconButton icon="search" label="검색" href="/search" />
      )}
      <IconButton icon="bell" label="알림" href="/notifications" dot />
    </header>
  )
}

/** 하위 화면 상단: 뒤로 · 가운데 제목 · 오른쪽(선택) */
export function BackBar({ title, back, right }: { title?: string; back?: string; right?: ReactNode }) {
  const router = useRouter()
  return (
    <header className="flex h-[52px] items-center pr-2 pl-1.5">
      {back ? (
        <IconButton icon="back" label="뒤로" href={back} />
      ) : (
        <IconButton icon="back" label="뒤로" onClick={() => router.back()} />
      )}
      <div className="grow text-center text-[15px] font-semibold">{title}</div>
      {right ?? <span className="w-11" />}
    </header>
  )
}

/** 모바일 화면 하단 고정 버튼 줄 */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[560px] items-center gap-2.5 border-t border-line bg-white px-5 pt-3 lg:hidden"
      style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  )
}

/**
 * 모바일 화면 틀(1024px 미만에서만 보임). 폭 560px까지 가운데.
 * tabbar: 하단 메뉴 · bottom: 하단 고정 버튼이 있으면 그만큼 아래 여백.
 */
export function MobileFrame({
  children,
  tabbar,
  bottom,
  className,
}: {
  children: ReactNode
  tabbar?: boolean
  bottom?: boolean
  className?: string
}) {
  return (
    <div className={`mx-auto max-w-[560px] lg:hidden ${className ?? ''}`}>
      {children}
      {(tabbar || bottom) && <div className="h-[100px]" />}
      {tabbar && <MobileTabBar />}
    </div>
  )
}

/** 데스크톱 본문 틀(1024px 이상에서만 보임). 폭 1184px(좌우 32px). */
export function DesktopFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto hidden max-w-[1184px] px-8 pt-10 pb-[88px] lg:block ${className ?? ''}`}>
      {children}
    </main>
  )
}
