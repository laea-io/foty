import type { Metadata } from 'next'
import { onboardingAction } from '@/app/actions/account'
import { ActionForm, FormError } from '@/components/forms/action-form'
import { LaterNextSubmit } from '@/components/onboarding/later-bar'
import { PickGroup, StepDots } from '@/components/onboarding/onboarding'
import { nextOf, withNext } from '@/components/onboarding/onboarding-form'
import { StationPick } from '@/components/onboarding/station-pick'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Narrow, PageTitle } from '@/components/ui/parts'
import { DemoNote } from '@/components/ui/primitives'
import { ToggleRow } from '@/components/ui/toggle'
import { requireViewer, type Viewer } from '@/lib/server/auth/session'
import { DEFAULT_ORIGIN, findStation, STATIONS } from '@/lib/shared/stations'

export const metadata: Metadata = { title: '기본 정보' }

/** 칩으로 보여 줄 자주 쓰는 출발역 — 나머지는 검색으로 */
const COMMON = ['상봉역', '청량리역', '왕십리역', '잠실역', '건대입구역', '강남역', '노원역', '구리역']
const STATION_NAMES = STATIONS.map((s) => s.name)
const TRANSPORT = ['대중교통', '자차']

function Body({ v, next, id }: { v: Viewer; next: string; id: string }) {
  // 옛 권역 값(상봉·중랑 등)은 역으로 맞지 않으면 기본 출발역으로
  const o = v.origin?.trim()
  const origin = (o && (findStation(o) ?? findStation(`${o}역`))?.name) || DEFAULT_ORIGIN
  const transport =
    v.prefs.transport && TRANSPORT.includes(v.prefs.transport) ? v.prefs.transport : '대중교통'
  return (
    <>
      <input type="hidden" name="step" value="2" />
      {next && <input type="hidden" name="next" value={next} />}
      <div className="mt-2">
        <StepDots step={1} />
      </div>
      <PageTitle sub="정확한 집 주소는 받지 않아요.">기본 정보를 알려주세요</PageTitle>
      <div className="mt-[26px] flex flex-col gap-5">
        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold">닉네임</span>
          <input
            name="nickname"
            defaultValue={v.name}
            maxLength={20}
            autoComplete="nickname"
            className="h-[50px] w-full rounded-[14px] border-0 bg-face px-4 text-[15px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-ink"
          />
        </label>
        <div>
          <div className="mb-2 text-[13px] font-semibold">성인 확인</div>
          <div className="[&>div]:border-t-0">
            <ToggleRow
              name="adult"
              title="만 19세 이상이에요"
              sub="foty는 성인만 이용할 수 있어요"
              defaultOn={v.adult || !v.onboarded}
            />
          </div>
        </div>
      </div>
      <div className="mt-[26px] mb-2.5 text-[14px] font-semibold">출발역</div>
      <StationPick
        id={`${id}-origin`}
        name="origin"
        stations={STATION_NAMES}
        common={COMMON}
        initial={origin}
      />
      <PickGroup name="transport" title="주로 타는 것" options={TRANSPORT} initial={[transport]} />
      <FormError className="mt-5" />
    </>
  )
}

export default async function Onboarding2Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const next = nextOf(await searchParams)
  const v = await requireViewer(withNext('/onboarding/2', next))
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="가입" back={withNext('/onboarding', next)} />
        <ActionForm action={onboardingAction}>
          <div className="px-5">
            <Body v={v} next={next} id="m" />
          </div>
          <DemoNote />
          <LaterNextSubmit nextLabel="다음" />
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="가입">
          <ActionForm action={onboardingAction}>
            <Body v={v} next={next} id="d" />
            <LaterNextSubmit nextLabel="다음" desktop />
          </ActionForm>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
