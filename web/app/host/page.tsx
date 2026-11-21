import type { Metadata } from 'next'
import Link from 'next/link'
import { HostHeadDesktop, HostHeadMobile } from '@/components/host/host-head'
import { BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import {
  AvatarStack,
  Badge,
  ButtonLink,
  buttonClass,
  DemoNote,
  Photo,
  Progress,
} from '@/components/ui/primitives'
import { hostThemes, themeRequests } from '@/lib/demo/host'
import type { Theme } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '호스트 — 내 테마' }

function ThemeHead({ t, badges }: { t: Theme; badges: React.ReactNode }) {
  return (
    <Link href={`/themes/${t.id}`} className="flex gap-3.5 text-ink no-underline">
      <Photo src={t.image.src} alt={t.image.alt} bg={t.image.bg} className="h-16 w-16 rounded-[12px]" />
      <div className="min-w-0 grow">
        <div className="flex items-center gap-1.5">{badges}</div>
        <div className="mt-[5px] truncate text-[15px] font-semibold tracking-[-0.02em]">{t.title}</div>
        <div className="mt-0.5 text-[12px] text-sub">
          {t.date} {t.start} · {t.place}
        </div>
      </div>
    </Link>
  )
}

function Recruiting() {
  const t = hostThemes.recruiting
  return (
    <div className="border-t border-line py-[18px]">
      <ThemeHead
        t={t}
        badges={
          <>
            <Badge>모집 중</Badge>
            <Badge tone="warn">성사까지 {t.min - t.current}명</Badge>
          </>
        }
      />
      <div className="mt-3.5">
        <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <AvatarStack names={['유나', '도현']} />
        <span className="text-[12px] text-sub">신청 2명 · 동행 3회, 첫 동행</span>
      </div>
      <div className="mt-3.5 flex gap-2">
        <Link href={`/host/themes/${t.id}/applicants`} className={buttonClass('primary', 'sm', 'flex-1')}>
          신청 현황
        </Link>
        <Link href={`/host/themes/${t.id}/add-date`} className={buttonClass('outline', 'sm', 'flex-1')}>
          날짜 추가
        </Link>
      </div>
    </div>
  )
}

function Matched() {
  const t = hostThemes.matched
  return (
    <div className="border-t border-line py-[18px]">
      <ThemeHead
        t={t}
        badges={
          <>
            <Badge tone="ink">성사</Badge>
            <Badge>일정 조율 중</Badge>
          </>
        }
      />
      <div className="mt-3.5 flex gap-2">
        <Link href={`/host/themes/${t.id}/space`} className={buttonClass('primary', 'sm', 'flex-1')}>
          그룹 공간
        </Link>
        <Link href="/host/checkin" className={buttonClass('outline', 'sm', 'flex-1')}>
          체크인 QR
        </Link>
      </div>
    </div>
  )
}

function SummaryCard({ wide }: { wide?: boolean }) {
  return (
    <Link
      href="/host/summary"
      className="flex items-center rounded-[16px] bg-face px-[18px] py-4 text-ink no-underline"
    >
      <span className="grow">
        <span className={`block text-sub ${wide ? 'text-[13px]' : 'text-[12px]'}`}>
          이번 달 방문 요약{wide && ' · 시연용 예시'}
        </span>
        <span className="mt-0.5 block text-[16px] font-extrabold tracking-[-0.02em]">
          방문객 18명 · 성사 4 / 6
        </span>
      </span>
      <Icon name="chevron" size={18} className="text-sub" />
    </Link>
  )
}

function Requests({ wide }: { wide?: boolean }) {
  const list = themeRequests.slice(0, 2)
  return (
    <>
      <div className={`mb-3 flex items-baseline justify-between ${wide ? 'mt-7' : 'mt-[18px]'}`}>
        <h2
          className={`m-0 font-extrabold ${wide ? 'text-[17px] tracking-[-0.03em]' : 'text-[18px] tracking-[-0.04em]'}`}
        >
          참여자가 남긴 테마 요청 {wide && <span className="font-medium text-muted">{list.length}</span>}
        </h2>
        {!wide && (
          <Link href="/host/requests" className="text-[12px] text-sub no-underline">
            {themeRequests.length}
          </Link>
        )}
      </div>
      {list.map((r) => (
        <div key={r.id} className="border-t border-line py-4">
          <div className="text-[15px] leading-[22px]">{r.text}</div>
          <div className={wide ? 'mt-2' : 'mt-2 flex items-center justify-between'}>
            <span className="block text-[12px] text-sub">
              {r.when} · {r.tags.join(', ')}
            </span>
            <Link
              href="/host/new"
              className={`text-[13px] font-semibold text-ink no-underline ${wide ? 'mt-2 inline-block' : ''}`}
            >
              이 요청으로 테마 열기 ›
            </Link>
          </div>
        </div>
      ))}
    </>
  )
}

export default async function HostThemesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const matchedOnly = (await searchParams).tab === 'matched'
  const current = matchedOnly ? '/host?tab=matched' : '/host'
  return (
    <>
      <MobileFrame bottom>
        <HostHeadMobile current={current} />
        <div className="px-5">
          <div className="mt-4">
            <SummaryCard />
          </div>
          <div className="mt-4">
            {!matchedOnly && <Recruiting />}
            <Matched />
          </div>
          <Requests />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/host/new" size="lg" icon="plus" block>
              새 테마 등록
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="flex items-start gap-14">
          <div className="min-w-0 flex-1">
            <HostHeadDesktop current={current} />
            <div className="mt-5 grid grid-cols-2 gap-x-8">
              {!matchedOnly && <Recruiting />}
              <Matched />
            </div>
          </div>
          <div className="w-[360px] flex-none">
            <SummaryCard wide />
            <Requests wide />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
