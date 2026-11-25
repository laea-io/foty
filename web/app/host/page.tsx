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
import { requireHost } from '@/lib/server/auth/session'
import { applicantsOf, hostSummary, hostThemes, requestsFor } from '@/lib/server/queries/host'
import type { ThemeView } from '@/lib/server/queries/themes'

export const metadata: Metadata = { title: '호스트 — 내 테마' }

function ThemeHead({ t, badges }: { t: ThemeView; badges: React.ReactNode }) {
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

async function Recruiting({ t }: { t: ThemeView }) {
  const apps = (await applicantsOf(t.id)).filter((a) => a.status !== '거절')
  const summary = apps.length
    ? `신청 ${apps.reduce((n, a) => n + a.party, 0)}명 · ${apps.map((a) => (a.trips ? `동행 ${a.trips}회` : '첫 동행')).join(', ')}`
    : '아직 신청이 없어요'
  return (
    <div className="border-t border-line py-[18px]">
      <ThemeHead
        t={t}
        badges={
          <>
            <Badge>모집 중</Badge>
            <Badge tone="warn">성사까지 {Math.max(0, t.min - t.current)}명</Badge>
            {t.pending > 0 && <Badge tone="ink">대기 {t.pending}</Badge>}
          </>
        }
      />
      <div className="mt-3.5">
        <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        {apps.length > 0 && <AvatarStack names={apps.map((a) => a.name).slice(0, 5)} />}
        <span className="text-[12px] text-sub">{summary}</span>
      </div>
      <div className="mt-3.5 flex gap-2">
        <Link href={`/host/themes/${t.id}/applicants`} className={buttonClass('primary', 'sm', 'flex-1')}>
          신청 현황
        </Link>
        <Link href={`/host/themes/${t.id}/add-date`} className={buttonClass('outline', 'sm', 'flex-1')}>
          날짜 추가
        </Link>
      </div>
      <div className="mt-2 flex gap-4 text-[12px]">
        <Link href={`/host/themes/${t.id}/edit`} className="text-sub">
          정보 고치기
        </Link>
        <Link href={`/host/themes/${t.id}/cancel`} className="text-warn">
          테마 취소
        </Link>
      </div>
    </div>
  )
}

function Matched({ t }: { t: ThemeView }) {
  return (
    <div className="border-t border-line py-[18px]">
      <ThemeHead
        t={t}
        badges={
          <>
            <Badge tone="ink">성사</Badge>
            <Badge tone={t.status === '일정 확정' ? 'ink' : 'soft'}>
              {t.status === '모집 중' ? '모집 중' : t.status}
            </Badge>
          </>
        }
      />
      <div className="mt-3.5 flex gap-2">
        <Link href={`/host/themes/${t.id}/space`} className={buttonClass('primary', 'sm', 'flex-1')}>
          그룹 공간
        </Link>
        <Link href={`/host/checkin?theme=${t.id}`} className={buttonClass('outline', 'sm', 'flex-1')}>
          체크인 QR
        </Link>
      </div>
      <div className="mt-2 flex gap-4 text-[12px]">
        <Link href={`/host/themes/${t.id}/edit`} className="text-sub">
          정보 고치기
        </Link>
        <Link href={`/host/themes/${t.id}/cancel`} className="text-warn">
          테마 취소
        </Link>
      </div>
    </div>
  )
}

function SummaryCard({ wide, line }: { wide?: boolean; line: string }) {
  return (
    <Link
      href="/host/summary"
      className="flex items-center rounded-[16px] bg-face px-[18px] py-4 text-ink no-underline"
    >
      <span className="grow">
        <span className={`block text-sub ${wide ? 'text-[13px]' : 'text-[12px]'}`}>이번 달 방문 요약</span>
        <span className="mt-0.5 block text-[16px] font-extrabold tracking-[-0.02em]">{line}</span>
      </span>
      <Icon name="chevron" size={18} className="text-sub" />
    </Link>
  )
}

function Requests({ wide, list }: { wide?: boolean; list: Awaited<ReturnType<typeof requestsFor>> }) {
  const top = list.slice(0, 2)
  return (
    <>
      <div className={`mb-3 flex items-baseline justify-between ${wide ? 'mt-7' : 'mt-[18px]'}`}>
        <h2
          className={`m-0 font-extrabold ${wide ? 'text-[17px] tracking-[-0.03em]' : 'text-[18px] tracking-[-0.04em]'}`}
        >
          참여자가 남긴 테마 요청 {wide && <span className="font-medium text-muted">{list.length}</span>}
        </h2>
        <Link href="/host/requests" className="text-[12px] text-sub no-underline">
          {wide ? '전체 보기' : list.length}
        </Link>
      </div>
      {top.map((r) => (
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
  const v = await requireHost()
  const matchedOnly = (await searchParams).tab === 'matched'
  const current = matchedOnly ? '/host?tab=matched' : '/host'
  const [mine, requests, sum] = await Promise.all([
    hostThemes(v.host.id),
    requestsFor(v.host.id),
    hostSummary(v.host.id, 'month'),
  ])
  const n = { recruiting: mine.recruiting.length, matched: mine.matched.length, past: mine.past.length }
  const line = `방문객 ${sum.stats[0].value}명 · 성사 ${sum.stats[2].value}`
  const pending = v.host.status !== '확인 완료'
  const list = (
    <>
      {pending && (
        <Link
          href="/host/join"
          className="mt-4 block rounded-[16px] bg-warn-bg px-4 py-3.5 text-[13px] text-warn no-underline"
        >
          운영팀이 {v.host.kind === 'business' ? '사업장' : '주민'} 확인을 하고 있어요. 확인되면 테마를 열 수
          있어요 ›
        </Link>
      )}
      {!matchedOnly && mine.recruiting.map((t) => <Recruiting key={t.id} t={t} />)}
      {mine.matched.map((t) => (
        <Matched key={t.id} t={t} />
      ))}
      {!mine.recruiting.length && !mine.matched.length && (
        <div className="border-t border-line py-10 text-center text-[13px] text-sub">
          지금 열려 있는 테마가 없어요
        </div>
      )}
    </>
  )
  return (
    <>
      <MobileFrame bottom>
        <HostHeadMobile current={current} n={n} />
        <div className="px-5">
          <div className="mt-4">
            <SummaryCard line={line} />
          </div>
          <div className="mt-4">{list}</div>
          <Requests list={requests} />
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
            <HostHeadDesktop current={current} n={n} />
            <div className="mt-5 grid grid-cols-2 gap-x-8">{list}</div>
          </div>
          <div className="w-[360px] flex-none">
            <SummaryCard wide line={line} />
            <Requests wide list={requests} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
