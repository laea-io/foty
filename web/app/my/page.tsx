import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { logoutAction } from '@/app/actions/auth'
import { H2 } from '@/components/a/form'
import { StampCell } from '@/components/a/stamps'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { DemoNote, IconButton } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import type { MenuItem } from '@/lib/demo/my'
import { requireViewer, type Viewer } from '@/lib/server/auth'
import { myPage, tasteOf } from '@/lib/server/q/a'

export const metadata: Metadata = { title: '마이' }

type Data = Awaited<ReturnType<typeof myPage>>
type Profile = {
  name: string
  line: string
  mobileStats: [string, string][]
  desktopStats: [string, string][]
}

function profileOf(v: Viewer, d: Data): Profile {
  const trips: [string, string] = [`${d.trips}회`, '동행 기록']
  return {
    name: v.name,
    line: [v.origin ? `${v.origin} 출발` : null, `동행 ${d.trips}회`].filter(Boolean).join(' · '),
    mobileStats: [trips, [String(d.upcoming), '예정'], [String(d.stampCount), '스탬프']],
    desktopStats: [trips, [String(d.upcoming), '예정'], [String(d.applying), '신청 중']],
  }
}

/** 메뉴(호스트 전환 · 운영팀은 사람에 따라) */
function menus(v: Viewer) {
  const host: MenuItem = v.host
    ? { href: '/host', label: '호스트 화면', icon: 'plus', aside: v.host.name }
    : { href: '/host/join', label: '호스트 신청', icon: 'plus', aside: '남양주 가게·관광지·주민' }
  const admin: MenuItem[] =
    v.role === 'admin'
      ? [{ href: '/admin', label: '운영팀', icon: 'settings', aside: '호스트 확인 · 신고' }]
      : []
  const logout: MenuItem = { href: '#logout', label: '로그아웃', icon: 'logout' }
  return {
    mobile: [
      { href: '/notifications', label: '알림', icon: 'bell' },
      host,
      ...admin,
      { href: '/my/privacy', label: '개인정보 공개 범위', icon: 'shield' },
      { href: '/my/blocks', label: '신고·차단 내역', icon: 'flag' },
      logout,
    ] as MenuItem[],
    desktop: [
      {
        href: '/my/privacy',
        label: '개인정보 공개 범위',
        icon: 'shield',
        aside: v.mbti ? (v.mbtiPublic ? 'MBTI 공개' : 'MBTI 비공개') : undefined,
      },
      { href: '/notifications', label: '알림', icon: 'bell', aside: '새 테마 · 성사' },
      { href: '/my/blocks', label: '신고·차단 내역', icon: 'flag' },
      host,
      ...admin,
      logout,
    ] as MenuItem[],
  }
}

/** 검정 프로필 카드(뒤에 큰 꽃 모양) */
function ProfileCard({ wide, p }: { wide?: boolean; p: Profile }) {
  const myProfile = p
  const stats = wide ? myProfile.desktopStats : myProfile.mobileStats
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] bg-ink ${wide ? 'px-4 pt-7 pb-4' : 'px-3.5 pt-[18px] pb-3.5'}`}
    >
      <span className={`absolute -top-[60px] -right-[50px] ${wide ? '' : 'opacity-90'}`}>
        <Mascot size={230} face={false} color="#1b1e25" />
      </span>
      {!wide && (
        <div className="relative flex justify-end gap-1">
          <IconButton icon="edit" label="프로필 편집" href="/onboarding/2?next=%2Fmy" color="text-white" />
          <IconButton icon="settings" label="설정" href="/my/privacy" color="text-white" />
        </div>
      )}
      <div className={`relative flex flex-col items-center ${wide ? 'pb-6' : 'pt-1 pb-[26px]'}`}>
        <span className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-avatar text-[40px] font-semibold text-sub">
          {myProfile.name.slice(0, 1)}
        </span>
        <div
          className={`mt-3.5 font-extrabold text-white ${wide ? 'text-[22px]' : 'text-[20px] tracking-[-0.03em]'}`}
        >
          {myProfile.name}
        </div>
        <div className={`mt-[3px] text-white/60 ${wide ? 'text-[13px]' : 'text-[12px]'}`}>
          {myProfile.line}
        </div>
      </div>
      <div className="relative flex gap-1.5">
        {stats.map(([v, k]) => (
          <div
            key={k}
            className={`flex flex-1 flex-col items-center justify-center rounded-[14px] bg-white/12 ${wide ? 'h-[58px]' : 'h-[54px]'}`}
          >
            <span className="text-[15px] font-bold text-white">{v}</span>
            <span className={`text-white/60 ${wide ? 'text-[11px]' : 'text-[10px]'}`}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MenuRow({ m, first, h = 54, aside }: { m: MenuItem; first?: boolean; h?: number; aside?: boolean }) {
  const cls = `flex w-full items-center gap-3 text-[15px] text-ink no-underline ${first || aside ? '' : 'border-t border-line'}`
  const inner = (
    <>
      <Icon name={m.icon} size={19} className="text-label" />
      <span className="grow text-left">{m.label}</span>
      {aside && m.aside && <span className="text-[13px] text-sub">{m.aside}</span>}
      <Icon name="chevron" size={14} weight={1.8} className="text-muted" />
    </>
  )
  // 로그아웃은 링크가 아니라 보내기(세션 행을 지운다)
  if (m.href === '#logout')
    return (
      <form action={logoutAction}>
        <button
          type="submit"
          className={`${cls} border-x-0 border-b-0 bg-transparent p-0`}
          style={{ height: h }}
        >
          {inner}
        </button>
      </form>
    )
  return (
    <Link href={m.href} className={cls} style={{ height: h }}>
      {inner}
    </Link>
  )
}

function TasteChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="inline-flex h-11 items-center rounded-full bg-face px-4 text-[15px] font-medium text-label"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

function DeskSection({
  title,
  aside,
  first,
  children,
}: {
  title: ReactNode
  aside?: ReactNode
  first?: boolean
  children: ReactNode
}) {
  return (
    <div className={first ? 'pb-6' : 'border-t border-line py-6'}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[17px] font-extrabold tracking-[-0.03em]">{title}</span>
        {aside}
      </div>
      {children}
    </div>
  )
}

export default async function MyPage() {
  const v = await requireViewer('/my')
  const d = await myPage(db, v.id)
  const p = profileOf(v, d)
  const taste = tasteOf(v.prefs)
  const menu = menus(v)
  const stampCount = d.stampCount
  return (
    <>
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5">
          <ProfileCard p={p} />
          <Link
            href="/my/stamps"
            className="mt-2.5 flex items-center gap-3 rounded-[20px] bg-face px-[18px] py-4 text-ink no-underline"
          >
            <Mascot size={36} />
            <span className="grow">
              <span className="block text-[14px] font-bold">스탬프북</span>
              <span className="mt-px block text-[12px] text-sub">
                다녀온 남양주 {stampCount}곳 · 빈 칸은 다음 여행의 계기예요
              </span>
            </span>
            <Icon name="chevron" size={14} weight={1.8} className="text-muted" />
          </Link>
          <H2
            aside={
              <Link href="/onboarding?next=%2Fmy" className="no-underline">
                수정
              </Link>
            }
          >
            내 여행 성향
          </H2>
          <TasteChips items={taste} />
          {d.tags.length > 0 && (
            <>
              <H2>받은 동행 태그</H2>
              <TasteChips items={d.tags.map(([t, n]) => `${t} ${n}`)} />
            </>
          )}
          <div className="mt-[22px]">
            {menu.mobile.map((m, i) => (
              <MenuRow key={m.href} m={m} first={i === 0} />
            ))}
          </div>
        </div>
        <DemoNote />
      </MobileFrame>

      <DesktopFrame>
        <div className="flex items-start gap-16">
          <div className="order-2 min-w-0 flex-1">
            <DeskSection
              first
              title={
                <>
                  스탬프북 <span className="font-medium text-muted">{stampCount}곳</span>
                </>
              }
              aside={
                <Link href="/my/stamps" className="text-[13px] text-sub">
                  전체 보기
                </Link>
              }
            >
              <div className="grid grid-cols-5 gap-2">
                {d.row.map((c) => (
                  <StampCell key={c.id} c={c} size={52} />
                ))}
              </div>
            </DeskSection>
            <DeskSection
              title="내 여행 성향"
              aside={
                <Link href="/onboarding?next=%2Fmy" className="text-[13px] text-sub no-underline">
                  수정
                </Link>
              }
            >
              <TasteChips items={taste} />
            </DeskSection>
            {d.tags.length > 0 && (
              <DeskSection title="받은 동행 태그">
                <TasteChips items={d.tags.map(([t, n]) => `${t} ${n}`)} />
              </DeskSection>
            )}
            <DeskSection
              title="MBTI"
              aside={
                <Link href="/onboarding/mbti?next=%2Fmy" className="text-[13px] text-sub no-underline">
                  {v.mbti ? '수정' : '입력'}
                </Link>
              }
            >
              <div className="text-[15px] text-sub">
                {v.mbti
                  ? `${v.mbti} · ${v.mbtiPublic ? '프로필에 공개' : '나만 보기'} · 자기소개용이며 추천에는 쓰지 않아요`
                  : '입력하지 않았어요 · 자기소개용이며 추천에는 쓰지 않아요'}
              </div>
            </DeskSection>
            <DeskSection title="설정">
              {menu.desktop.map((m) => (
                <MenuRow key={m.href} m={m} h={52} aside />
              ))}
            </DeskSection>
          </div>
          <div className="w-[360px] flex-none">
            <ProfileCard wide p={p} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
