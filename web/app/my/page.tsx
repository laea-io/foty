import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { H2 } from '@/components/a/form'
import { StampCell } from '@/components/a/stamps'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Mascot } from '@/components/ui/mascot'
import { DemoNote, IconButton } from '@/components/ui/primitives'
import { desktopMenu, type MenuItem, mobileMenu, myProfile } from '@/lib/demo/my'
import { myStampRow, stampCount } from '@/lib/demo/stamps'

export const metadata: Metadata = { title: '마이' }

/** 검정 프로필 카드(뒤에 큰 꽃 모양) */
function ProfileCard({ wide }: { wide?: boolean }) {
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
          <IconButton icon="edit" label="프로필 편집" href="/onboarding/2" color="text-white" />
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
  return (
    <Link
      href={m.href}
      className={`flex items-center gap-3 text-[15px] text-ink no-underline ${first || aside ? '' : 'border-t border-line'}`}
      style={{ height: h }}
    >
      <Icon name={m.icon} size={19} className="text-label" />
      <span className="grow">{m.label}</span>
      {aside && <span className="text-[13px] text-sub">{m.aside}</span>}
      <Icon name="chevron" size={14} weight={1.8} className="text-muted" />
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

export default function MyPage() {
  return (
    <>
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5">
          <ProfileCard />
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
              <Link href="/onboarding" className="no-underline">
                수정
              </Link>
            }
          >
            내 여행 성향
          </H2>
          <TasteChips items={myProfile.mobileTaste} />
          <div className="mt-[22px]">
            {mobileMenu.map((m, i) => (
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
                {myStampRow.map((c) => (
                  <StampCell key={c.id} c={c} size={52} />
                ))}
              </div>
            </DeskSection>
            <DeskSection
              title="내 여행 성향"
              aside={
                <Link href="/onboarding" className="text-[13px] text-sub no-underline">
                  수정
                </Link>
              }
            >
              <TasteChips items={myProfile.desktopTaste} />
            </DeskSection>
            <DeskSection
              title="MBTI"
              aside={
                <Link href="/onboarding/mbti" className="text-[13px] text-sub no-underline">
                  입력
                </Link>
              }
            >
              <div className="text-[15px] text-sub">
                입력하지 않았어요 · 자기소개용이며 추천에는 쓰지 않아요
              </div>
            </DeskSection>
            <DeskSection title="설정">
              {desktopMenu.map((m) => (
                <MenuRow key={m.href} m={m} h={52} aside />
              ))}
            </DeskSection>
          </div>
          <div className="w-[360px] flex-none">
            <ProfileCard wide />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
