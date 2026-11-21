import Link from 'next/link'
import type { ReactNode } from 'react'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { Badge, ButtonLink, DemoNote, Photo, Progress, Segmented } from '@/components/ui/primitives'
import type { Theme } from '@/lib/demo/themes'
import { applying, cancelled, past, type TripBadge, themeOf, tripTabs, upcoming } from '@/lib/demo/trips'
import { ShareAction, ToggleButton } from './actions'

/** 내 여행 카드: 64px 사진 · 배지 · 제목 · 날짜 + 아래 내용 */
export function TripCard({ t, badges, children }: { t: Theme; badges: TripBadge[]; children?: ReactNode }) {
  return (
    <div className="border-t border-line py-[18px]">
      <Link href={`/themes/${t.id}`} className="flex gap-3.5 text-ink no-underline">
        <Photo src={t.image.src} alt={t.image.alt} bg={t.image.bg} className="h-16 w-16 rounded-[12px]" />
        <div className="min-w-0 grow">
          <div className="flex items-center gap-1.5">
            {badges.map((b) => (
              <Badge key={b.label} tone={b.tone}>
                {b.label}
              </Badge>
            ))}
          </div>
          <div className="mt-[5px] truncate text-[15px] font-semibold tracking-[-0.02em]">{t.title}</div>
          <div className="mt-0.5 text-[12px] text-sub">
            {t.date} {t.start} · {t.place}
          </div>
        </div>
      </Link>
      {children}
    </div>
  )
}

function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-warn">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </div>
  )
}

const half = 'flex-1'

function ApplyingCards() {
  return applying.map((a) => {
    const t = themeOf(a.id)
    return (
      <TripCard key={a.id} t={t} badges={a.badges}>
        <div className="mt-3.5">
          <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
        </div>
        <div className="mt-3.5 flex gap-2">
          <ShareAction label="친구에게 공유" title={t.title} path={`/themes/${t.id}`} className={half} />
          <ButtonLink href={`/themes/${t.id}/cancel-done`} variant="outline" size="sm" className={half}>
            신청 취소
          </ButtonLink>
        </div>
      </TripCard>
    )
  })
}

/** 신청 중 탭에 함께 보이는 예정(확인이 필요한 여행) */
function UpcomingNeedsCheck() {
  const u = upcoming[0]
  const t = themeOf(u.id)
  return (
    <TripCard
      t={t}
      badges={[
        { tone: 'ink', label: '성사' },
        { tone: 'soft', label: u.status },
      ]}
    >
      {u.alert && <Alert>{u.alert}</Alert>}
      <div className="mt-3">
        <ButtonLink href={`/trips/${t.id}`} size="sm" block>
          그룹 공간 열기
        </ButtonLink>
      </div>
    </TripCard>
  )
}

function CancelledCards() {
  return cancelled.map((c) => {
    const t = themeOf(c.id)
    return (
      <TripCard key={c.id} t={t} badges={[{ tone: 'muted', label: '취소' }]}>
        <div className="mt-2.5 text-[12px] text-sub">{c.reason}</div>
        <div className="mt-3">
          <ButtonLink href={`/themes/${t.id}/cancelled`} variant="outline" size="sm" block>
            다른 날짜와 비슷한 테마 보기
          </ButtonLink>
        </div>
      </TripCard>
    )
  })
}

function UpcomingCards() {
  return upcoming.map((u) => {
    const t = themeOf(u.id)
    return (
      <TripCard
        key={u.id}
        t={t}
        badges={[
          { tone: 'ink', label: u.dday },
          { tone: 'soft', label: u.status },
        ]}
      >
        {u.alert && <Alert>{u.alert}</Alert>}
        {u.meet && <div className="mt-2.5 text-[12px] text-sub">{u.meet}</div>}
        {u.alert ? (
          <div className="mt-3 flex gap-2">
            <ButtonLink href={`/trips/${t.id}`} size="sm" className={half}>
              그룹 공간
            </ButtonLink>
            <ButtonLink href={`/trips/${t.id}/checkin`} variant="outline" size="sm" className={half}>
              현장 체크인
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-3">
            <ButtonLink href={`/trips/${t.id}`} size="sm" block>
              그룹 공간
            </ButtonLink>
          </div>
        )}
      </TripCard>
    )
  })
}

function PastCards() {
  return past.map((p) => {
    const t = themeOf(p.id)
    return (
      <TripCard key={p.id} t={t} badges={[{ tone: 'soft', label: '여행 완료' }, p.check]}>
        {p.note && <div className="mt-2.5 text-[12px] leading-[18px] text-sub">{p.note}</div>}
        {p.review ? (
          <>
            <div className="mt-3 flex gap-2">
              <ButtonLink href={`/community/write?theme=${t.id}`} size="sm" className={half}>
                후기 남기기
              </ButtonLink>
              <ButtonLink href={`/trips/${t.id}/review`} variant="outline" size="sm" className={half}>
                평가하기
              </ButtonLink>
            </div>
            <div className="mt-2 text-[11px] text-muted">{p.review}</div>
          </>
        ) : (
          <div className="mt-3">
            <ToggleButton label="참여했다고 알리기" done="호스트에게 알렸어요" className="w-full" />
          </div>
        )}
      </TripCard>
    )
  })
}

type Tab = 'applying' | 'upcoming' | 'past'
const tabHref: Record<Tab, string> = { applying: '/trips', upcoming: '/trips/upcoming', past: '/trips/past' }

/** 내 여행(신청 중 · 예정 · 지난 여행) — 모바일 + 데스크톱 */
export function TripsView({ tab }: { tab: Tab }) {
  const tabs = tripTabs()
  const current = tabHref[tab]
  return (
    <>
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5">
          <Segmented items={tabs} current={current} />
          <div className="mt-2">
            {tab === 'applying' && (
              <>
                <ApplyingCards />
                <MobileHead title="예정" />
                <UpcomingNeedsCheck />
                <MobileHead title="취소된 신청" />
                <CancelledCards />
              </>
            )}
            {tab === 'upcoming' && <UpcomingCards />}
            {tab === 'past' && <PastCards />}
          </div>
          <DemoNote />
        </div>
      </MobileFrame>

      <DesktopFrame>
        <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">내 여행</h1>
        <div className="mt-5 w-[420px]">
          <Segmented items={tabs} current={current} />
        </div>
        {tab === 'applying' ? (
          <div className="mt-8 flex gap-10">
            <DesktopColumn title="신청 중">
              <ApplyingCards />
            </DesktopColumn>
            <DesktopColumn title="예정">
              <UpcomingNeedsCheck />
            </DesktopColumn>
            <DesktopColumn title="취소된 신청">
              <CancelledCards />
            </DesktopColumn>
          </div>
        ) : (
          <div className="mt-2 max-w-[760px]">{tab === 'upcoming' ? <UpcomingCards /> : <PastCards />}</div>
        )}
      </DesktopFrame>
    </>
  )
}

function MobileHead({ title }: { title: string }) {
  return (
    <div className="mt-[18px] mb-3 flex items-baseline justify-between">
      <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">{title}</h2>
    </div>
  )
}

function DesktopColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3.5 text-[18px] font-extrabold tracking-[-0.03em]">{title}</div>
      {children}
    </div>
  )
}
