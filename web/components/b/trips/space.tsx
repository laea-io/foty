import Link from 'next/link'
import type { ReactNode } from 'react'
import { BackBar } from '@/components/shell/mobile'
import { StopList } from '@/components/theme/parts'
import { Icon } from '@/components/ui/icon'
import { AvatarStack, Badge, ButtonLink, IconButton, Segmented, StepNo } from '@/components/ui/primitives'
import type { Theme } from '@/lib/demo/themes'
import { changeRequest, guests, history, host, members, type Space } from '@/lib/demo/trips'
import { CourseToggle, ShareAction } from './actions'
import { RouteMap } from './route-map'

export type Tab = 'plan' | 'chat' | 'members'

export const spaceTabs = (id: string) => [
  { href: `/trips/${id}`, label: '일정' },
  { href: `/trips/${id}/chat`, label: '대화' },
  { href: `/trips/${id}/members`, label: `참여자 ${members.length}` },
]
const tabIndex: Record<Tab, number> = { plan: 0, chat: 1, members: 2 }

const names = members.map((m) => m.name)
const hostLine = `호스트 ${host.name} · 참여자 ${guests.length}명`

/** 모바일 공간 머리: 뒤로 · D-day · 제목 · 참여자 · 탭 */
export function SpaceMobileHead({ s, t, tab }: { s: Space; t: Theme; tab: Tab }) {
  const tabs = spaceTabs(t.id)
  return (
    <>
      <BackBar title="그룹 여행 공간" back="/trips" right={<IconButton icon="more" label="더보기" />} />
      <div className="px-5 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold">
            {s.dday}{' '}
            <span className="font-normal text-sub">
              · {t.date} {t.start}
            </span>
          </span>
          <Badge>{s.status}</Badge>
        </div>
        <h1 className="mt-2 mb-0 text-[23px] leading-[30px] font-extrabold tracking-[-0.05em]">{t.title}</h1>
        <div className="mt-3 flex items-center gap-2">
          <AvatarStack names={names} />
          <span className="text-[12px] text-sub">{hostLine}</span>
        </div>
        <div className="mt-[18px]">
          <Segmented items={tabs} current={tabs[tabIndex[tab]].href} />
        </div>
      </div>
    </>
  )
}

/** 데스크톱 공간 머리: 왼쪽 제목, 오른쪽 탭 */
export function SpaceDesktopHead({ s, t, tab }: { s: Space; t: Theme; tab: Tab }) {
  const tabs = spaceTabs(t.id)
  return (
    <div className="flex items-end gap-6">
      <div className="grow">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold">
            {s.dday}{' '}
            <span className="font-normal text-sub">
              · {t.date} {t.start}
            </span>
          </span>
          <Badge>{s.status}</Badge>
        </div>
        <h1 className="mt-2 mb-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">{t.title}</h1>
        <div className="mt-3.5 flex items-center gap-2">
          <AvatarStack names={names} size={32} />
          <span className="text-[13px] text-sub">{hostLine}</span>
        </div>
      </div>
      <div className="w-[400px] flex-none">
        <Segmented items={tabs} current={tabs[tabIndex[tab]].href} />
      </div>
    </div>
  )
}

/** 확인 요청 카드: 변경 확인 중 · 08:40 → 08:20 · 3 / 5명 확인 */
export function ChangeCard({ id, from = 'space' }: { id: string; from?: 'space' | 'chat' }) {
  const c = changeRequest
  return (
    <div className="rounded-[16px] bg-face px-[18px] pt-4 pb-[18px]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-warn">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          변경 확인 중 · {c.label}
        </span>
        <span className="text-[12px] text-sub">
          {c.confirmed.length} / {members.length}명 확인
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[16px] text-muted line-through">{c.from}</span>
        <span className="text-[26px] font-extrabold tracking-[-0.04em]">{c.to}</span>
        <span className="text-[12px] text-sub">{c.where}</span>
      </div>
      <div className="mt-2 text-[11px] text-sub">
        확인: {c.confirmed.join(' · ')} <span className="text-muted">| 아직: {c.waiting.join(' · ')}</span>
      </div>
      {from === 'space' ? (
        <div className="mt-3.5 flex gap-2">
          <ButtonLink href={`/trips/${id}/history`} size="sm" className="flex-1">
            확인했어요
          </ButtonLink>
          <ButtonLink href={`/trips/${id}/chat`} variant="outline" size="sm" className="flex-1">
            의견 남기기
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-3">
          <ButtonLink href={`/trips/${id}`} size="sm" block>
            일정에서 확인하기
          </ButtonLink>
        </div>
      )}
    </div>
  )
}

function CourseHead({ id, wide }: { id: string; wide?: boolean }) {
  return (
    <>
      <div className={`mb-3 flex items-baseline justify-between ${wide ? 'mt-8' : 'mt-[30px]'}`}>
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">코스</h2>
        <Link href={`/trips/${id}/history`} className="text-[12px] text-sub no-underline">
          변경 이력 {history.filter((h) => h.badge.tone !== 'warn').length}
        </Link>
      </div>
      <div className="mt-[-4px] mb-2.5 flex items-center gap-1.5 text-[12px] text-sub">
        <Icon name="people" size={14} weight={1.7} />
        이동 · 대중교통으로 함께 가요 (차량 동승 없음)
      </div>
    </>
  )
}

/** 지도 보기: 약도 + 장소 순서 */
function MapView({ t }: { t: Theme }) {
  return (
    <div className="mt-2">
      <RouteMap count={t.stops.length} kind="tall" className="h-[320px] rounded-[16px]" />
      <ol className="m-0 mt-3 list-none p-0">
        {t.stops.map((st, i) => (
          <li key={st.name} className="flex items-center gap-3 py-2 text-[14px]">
            <StepNo n={i + 1} />
            <span className="grow font-semibold">{st.name}</span>
            <span className="text-[12px] text-sub">{st.time}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SpaceActions({ t, wide }: { t: Theme; wide?: boolean }) {
  const cls = 'flex-1'
  return (
    <div className={`flex gap-2 ${wide ? 'mt-4' : 'mt-2'}`}>
      <ButtonLink href={`/trips/${t.id}/ai`} variant="outline" icon="sparkle" className={cls}>
        AI 도우미
      </ButtonLink>
      <ShareAction
        label="가족에게 일정 공유"
        title={`${t.title} 일정`}
        variant="outline"
        size="md"
        className={cls}
      />
    </div>
  )
}

/** 모바일 일정 탭 본문 */
export function SpacePlanMobile({ t, change }: { t: Theme; change: boolean }) {
  return (
    <div className="px-5">
      {change && (
        <div className="mt-4">
          <ChangeCard id={t.id} />
        </div>
      )}
      <CourseHead id={t.id} />
      <CourseToggle
        list={
          <>
            <StopList stops={t.stops} />
            <RouteMap count={t.stops.length} className="mt-2 h-[140px] rounded-[16px]" />
          </>
        }
        map={<MapView t={t} />}
      />
      <Link
        href={`/trips/${t.id}/checkin`}
        className="mt-4 flex items-center gap-3 rounded-[16px] bg-ink px-[18px] py-4 text-white no-underline"
      >
        <span className="grow">
          <span className="block text-[15px] font-bold">현장 체크인</span>
          <span className="mt-px block text-[12px] text-white/65">핵심 장소 {t.place}에서 QR을 찍어요</span>
        </span>
        <Icon name="chevron" size={14} weight={1.8} />
      </Link>
      <SpaceActions t={t} />
    </div>
  )
}

/** 데스크톱 일정 탭: 왼쪽 480px(확인 카드 · 코스) + 오른쪽(약도 또는 AI 도우미) */
export function SpacePlanDesktop({ t, change, right }: { t: Theme; change: boolean; right?: ReactNode }) {
  return (
    <div className="mt-8 flex items-start gap-10">
      <div className="w-[480px] flex-none">
        {change && <ChangeCard id={t.id} />}
        <CourseHead id={t.id} wide />
        <StopList stops={t.stops} className="-mt-2" />
        <SpaceActions t={t} wide />
      </div>
      <div className="min-w-0 flex-1">
        {right ?? <RouteMap count={t.stops.length} kind="tall" className="h-[560px] rounded-[20px]" />}
      </div>
    </div>
  )
}
