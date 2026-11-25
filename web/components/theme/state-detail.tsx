import Link from 'next/link'
import type { ReactNode } from 'react'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { OtherDateRows, SectionHead, ThemeList } from '@/components/theme/flow'
import { NotifyDate } from '@/components/theme/notify-date'
import { StopList } from '@/components/theme/parts'
import { ShareButton } from '@/components/theme/share-button'
import { ShareAction } from '@/components/trips/actions'
import { Icon } from '@/components/ui/icon'
import {
  Badge,
  type BadgeTone,
  ButtonLink,
  DemoNote,
  Note,
  Photo,
  Progress,
} from '@/components/ui/primitives'
import type { OtherDate } from '@/lib/server/queries/theme-screens'
import type { Theme } from '@/lib/shared/theme'

export type DetailState = 'closed' | 'confirmed' | 'done'

/** 상태별 화면이 DB에서 받는 것(app/themes/[id]/page.tsx가 모은다) */
export type StateExtra = {
  hostName: string
  hostId: string
  /** 같은 테마의 다른 날짜(모집 마감) */
  dates: OtherDate[]
  /** 이 호스트의 새 테마(여행 완료) */
  hostList: Theme[]
  /** 확정된 집결(일정 확정) */
  meet: string
  memberCount: number
  /** 확인 중인 주요 변경이 없으면 true */
  allConfirmed: boolean
  historyCount: number
  /** 내 참여 상태(여행 완료) */
  attended: string | null
  checkedIn: boolean
  subscribed: boolean
  loggedIn: boolean
}

const head: Record<DetailState, { label: string; tone: BadgeTone; back: string }> = {
  closed: { label: '모집 마감', tone: 'soft', back: '/' },
  confirmed: { label: '일정 확정', tone: 'ink', back: '/trips' },
  done: { label: '여행 완료', tone: 'ink', back: '/trips' },
}

/** 테마 상세의 상태별 화면: 모집 마감 · 일정 확정 · 여행 완료 */
export function StateDetail({ t, state, x }: { t: Theme; state: DetailState; x: StateExtra }) {
  const h = head[state]
  const title = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold">
          {t.date} {t.start}
        </span>
        <Badge tone={h.tone}>{h.label}</Badge>
      </div>
      <h1 className="mt-2 mb-0 text-[26px] leading-[33px] font-extrabold tracking-[-0.05em]">{t.title}</h1>
      <div className="mt-1.5 flex items-center gap-1 text-[13px] text-sub">
        <Icon name="pin" size={15} />
        핵심 장소 · {t.place}
        {` · 호스트 ${x.hostName}`}
      </div>
    </>
  )
  const body = <Body t={t} state={state} x={x} />
  const notify = <NotifyDate hostId={x.hostId} themeId={t.id} on={x.subscribed} loggedIn={x.loggedIn} />
  const space = (
    <ButtonLink href={`/trips/${t.id}`} size="lg" block>
      그룹 공간 열기
    </ButtonLink>
  )
  const review = (
    <ButtonLink href={`/trips/${t.id}/review`} variant="outline" size="lg">
      평가하기
    </ButtonLink>
  )
  const write = (
    <ButtonLink href={`/community/write?theme=${t.id}`} size="lg" block>
      후기 남기기
    </ButtonLink>
  )

  return (
    <>
      <MobileFrame bottom>
        <BackBar title="테마" back={h.back} />
        <div className="px-5">
          <Photo src={t.image.src} alt={t.image.alt} bg={t.image.bg} className="-mx-5 h-[240px]" />
          <div className="mt-5">{title}</div>
          {body}
          <DemoNote />
        </div>
        <BottomBar>
          {state === 'closed' && (
            <>
              <ShareButton title={t.title} wide />
              <div className="grow">{notify}</div>
            </>
          )}
          {state === 'confirmed' && (
            <>
              <ShareAction label="가족에게 공유" title={t.title} variant="outline" size="lg" />
              <div className="grow">{space}</div>
            </>
          )}
          {state === 'done' && (
            <>
              {review}
              <div className="grow">{write}</div>
            </>
          )}
        </BottomBar>
      </MobileFrame>

      <DesktopFrame>
        <div className="flex items-start gap-14">
          <div className="min-w-0 flex-1">
            <Photo
              src={t.image.src}
              alt={t.image.alt}
              bg={t.image.bg}
              className="h-[380px] w-full rounded-[20px]"
            />
            <div className="mt-2">{body}</div>
          </div>
          <div className="sticky top-6 w-[400px] flex-none">
            <div className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
              {title}
              <div className="mt-[22px] flex gap-2">
                {state === 'closed' && (
                  <>
                    <div className="grow">{notify}</div>
                    <ShareButton title={t.title} wide />
                  </>
                )}
                {state === 'confirmed' && (
                  <>
                    <div className="grow">{space}</div>
                    <ShareButton title={t.title} wide />
                  </>
                )}
                {state === 'done' && (
                  <>
                    <div className="grow">{write}</div>
                    {review}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}

function Body({ t, state, x }: { t: Theme; state: DetailState; x: StateExtra }) {
  if (state === 'closed')
    return (
      <>
        <div className="mt-[22px]">
          <Progress current={t.current} max={t.max} min={t.min} deadline="정원이 찼어요" deadlinePrefix="" />
        </div>
        <Note className="mt-4">
          신청을 더 받지 않아요. 같은 테마의 다른 날짜가 열리면 알려드릴 수 있어요.
        </Note>
        <SectionHead title="같은 테마의 다른 날짜" />
        {x.dates.length ? (
          <OtherDateRows dates={x.dates} />
        ) : (
          <div className="border-t border-line py-[15px] text-[13px] text-sub">
            아직 열린 다른 날짜가 없어요.
          </div>
        )}
      </>
    )
  if (state === 'confirmed')
    return (
      <>
        <div className="mt-[22px] rounded-[16px] bg-face p-[18px]">
          <div className="text-[12px] text-sub">확정된 집결</div>
          <div className="mt-1 text-[20px] font-extrabold tracking-[-0.03em]">{x.meet}</div>
          <div className="mt-1.5 text-[12px] text-sub">
            참여자 {x.memberCount}명{x.allConfirmed ? ' 모두 확인했어요' : ' · 확인 중인 변경이 있어요'}
          </div>
        </div>
        <SectionHead
          title="확정 일정"
          aside={
            <Link href={`/trips/${t.id}/history`} className="text-[12px] text-sub no-underline">
              변경 이력 {x.historyCount}
            </Link>
          }
        />
        <div className="-mt-1 mb-2.5 flex items-center gap-1.5 text-[12px] text-sub">
          <Icon name="people" size={16} />
          이동 · 대중교통으로 함께 가요 (차량 동승 없음)
        </div>
        <StopList stops={t.stops} className="-mt-2" />
      </>
    )
  return (
    <>
      <div className="mt-[22px] flex border-y border-line py-[18px]">
        <Fact label="참여" value={x.checkedIn ? '체크인 확인' : (x.attended ?? '확인 대기')} />
        <Fact label="다녀온 곳" value={`${t.stops.length}곳`} divider />
        <Fact label="받은 스탬프" value={x.checkedIn ? t.place : '없음'} divider />
      </div>
      <SectionHead title="다녀온 코스" />
      <StopList stops={t.stops} className="-mt-2" />
      <SectionHead title="이 호스트의 새 테마" />
      <ThemeList list={x.hostList} />
    </>
  )
}

function Fact({ label, value, divider }: { label: string; value: ReactNode; divider?: boolean }) {
  return (
    <div className={`flex-1 ${divider ? 'border-l border-line pl-4' : ''}`}>
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold">{value}</div>
    </div>
  )
}
