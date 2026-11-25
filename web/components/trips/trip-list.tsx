import Link from 'next/link'
import type { ReactNode } from 'react'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { CancelButton } from '@/components/theme/cancel-button'
import { ShareAction } from '@/components/trips/actions'
import { TellAttended } from '@/components/trips/forms'
import type { TripBadge } from '@/components/trips/types'
import { Badge, ButtonLink, DemoNote, Photo, Progress, Segmented } from '@/components/ui/primitives'
import type { ApplyingItem, CancelledItem, PastItem, UpcomingItem } from '@/lib/server/queries/trips'
import type { Theme } from '@/lib/shared/theme'

export type TripsData = {
  applying: ApplyingItem[]
  upcoming: UpcomingItem[]
  cancelled: CancelledItem[]
  past: PastItem[]
}

/** 내 여행 카드: 64px 사진 · 배지 · 제목 · 날짜 + 아래 내용 */
function TripCard({ t, badges, children }: { t: Theme; badges: TripBadge[]; children?: ReactNode }) {
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

function Empty({ children }: { children: ReactNode }) {
  return <div className="border-t border-line py-[18px] text-[13px] text-sub">{children}</div>
}

function ApplyingCards({ list }: { list: ApplyingItem[] }) {
  if (!list.length) return <Empty>신청 중인 테마가 없어요.</Empty>
  return list.map(({ t, badges }) => (
    <TripCard key={t.id} t={t} badges={badges}>
      <div className="mt-3.5">
        <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <div className="mt-3.5 flex gap-2">
        <ShareAction label="친구에게 공유" title={t.title} path={`/themes/${t.id}`} className={half} />
        <CancelButton themeId={t.id} size="sm" className={half} />
      </div>
    </TripCard>
  ))
}

/** 신청 중 탭에 함께 보이는 예정(확인이 필요한 여행 먼저) */
function UpcomingNeedsCheck({ list }: { list: UpcomingItem[] }) {
  const u = list.find((x) => x.alert) ?? list[0]
  if (!u) return <Empty>성사된 여행이 아직 없어요.</Empty>
  const t = u.t
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

function CancelledCards({ list }: { list: CancelledItem[] }) {
  if (!list.length) return <Empty>취소된 신청이 없어요.</Empty>
  return list.map((c) => (
    <TripCard key={c.t.id} t={c.t} badges={[c.badge]}>
      <div className="mt-2.5 text-[12px] text-sub">{c.reason}</div>
      <div className="mt-3">
        <ButtonLink href={c.href} variant="outline" size="sm" block>
          {c.label}
        </ButtonLink>
      </div>
    </TripCard>
  ))
}

function UpcomingCards({ list }: { list: UpcomingItem[] }) {
  if (!list.length) return <Empty>예정된 여행이 없어요. 테마가 성사되면 여기에 보여요.</Empty>
  return list.map((u) => {
    const t = u.t
    return (
      <TripCard
        key={t.id}
        t={t}
        badges={[
          { tone: 'ink', label: u.dday },
          { tone: 'soft', label: u.status },
        ]}
      >
        {u.alert && <Alert>{u.alert}</Alert>}
        {!u.alert && u.meet && <div className="mt-2.5 text-[12px] text-sub">{u.meet}</div>}
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

function PastCards({ list }: { list: PastItem[] }) {
  if (!list.length) return <Empty>지난 여행이 없어요.</Empty>
  return list.map((p) => {
    const t = p.t
    return (
      <TripCard key={t.id} t={t} badges={p.badges}>
        {p.note && <div className="mt-2.5 text-[12px] leading-[18px] text-sub">{p.note}</div>}
        {p.review ? (
          <>
            <div className="mt-3 flex gap-2">
              <ButtonLink href={`/community/write?theme=${t.id}`} size="sm" className={half}>
                후기 남기기
              </ButtonLink>
              {p.canReview && (
                <ButtonLink href={`/trips/${t.id}/review`} variant="outline" size="sm" className={half}>
                  평가하기
                </ButtonLink>
              )}
            </div>
            <div className="mt-2 text-[11px] text-muted">{p.review}</div>
          </>
        ) : p.askable ? (
          <div className="mt-3">
            <TellAttended themeId={t.id} told={!!p.told} />
          </div>
        ) : null}
      </TripCard>
    )
  })
}

type Tab = 'applying' | 'upcoming' | 'past'
const tabHref: Record<Tab, string> = { applying: '/trips', upcoming: '/trips/upcoming', past: '/trips/past' }

/** 내 여행(신청 중 · 예정 · 지난 여행) — 모바일 + 데스크톱 */
export function TripsView({ tab, data }: { tab: Tab; data: TripsData }) {
  const tabs = [
    { href: '/trips', label: `신청 중 ${data.applying.length}` },
    { href: '/trips/upcoming', label: `예정 ${data.upcoming.length}` },
    { href: '/trips/past', label: '지난 여행' },
  ]
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
                <ApplyingCards list={data.applying} />
                <MobileHead title="예정" />
                <UpcomingNeedsCheck list={data.upcoming} />
                <MobileHead title="취소된 신청" />
                <CancelledCards list={data.cancelled} />
              </>
            )}
            {tab === 'upcoming' && <UpcomingCards list={data.upcoming} />}
            {tab === 'past' && <PastCards list={data.past} />}
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
              <ApplyingCards list={data.applying} />
            </DesktopColumn>
            <DesktopColumn title="예정">
              <UpcomingNeedsCheck list={data.upcoming} />
            </DesktopColumn>
            <DesktopColumn title="취소된 신청">
              <CancelledCards list={data.cancelled} />
            </DesktopColumn>
          </div>
        ) : (
          <div className="mt-2 max-w-[760px]">
            {tab === 'upcoming' ? <UpcomingCards list={data.upcoming} /> : <PastCards list={data.past} />}
          </div>
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
