import type { Metadata } from 'next'
import { Narrow, PageTitle } from '@/components/a/form'
import { LaterNext } from '@/components/a/later-bar'
import { PickGroup, StepDots } from '@/components/a/onboarding'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '기본 정보' }

function Body() {
  return (
    <>
      <div className="mt-2">
        <StepDots step={1} />
      </div>
      <PageTitle sub="정확한 집 주소는 받지 않아요.">기본 정보를 알려주세요</PageTitle>
      <div className="mt-[26px] flex flex-col gap-5">
        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold">닉네임</span>
          <input
            name="nickname"
            defaultValue="강현"
            autoComplete="nickname"
            className="h-[50px] w-full rounded-[14px] border-0 bg-face px-4 text-[15px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-ink"
          />
        </label>
        <div>
          <div className="mb-2 text-[13px] font-semibold">성인 확인</div>
          <div className="[&>div]:border-t-0">
            <ToggleRow title="만 19세 이상이에요" sub="foty는 성인만 이용할 수 있어요" defaultOn />
          </div>
        </div>
      </div>
      <PickGroup
        title="출발 권역"
        options={['상봉·중랑', '청량리·동대문', '잠실·송파', '구리', '하남', '의정부', '직접 입력']}
        initial={['상봉·중랑']}
      />
      <PickGroup title="주로 타는 것" options={['대중교통', '자차']} initial={['대중교통']} />
    </>
  )
}

export default function Onboarding2Page() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="가입" back="/onboarding" />
        <div className="px-5">
          <Body />
        </div>
        <DemoNote />
        <LaterNext nextHref="/onboarding/3" nextLabel="다음" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="가입">
          <Body />
          <LaterNext nextHref="/onboarding/3" nextLabel="다음" desktop />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
