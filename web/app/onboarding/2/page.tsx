import type { Metadata } from 'next'
import { onboardingAction } from '@/app/actions/a'
import { ActionForm, FormError } from '@/components/a/action-form'
import { Narrow, PageTitle } from '@/components/a/form'
import { LaterNextSubmit } from '@/components/a/later-bar'
import { PickGroup, StepDots } from '@/components/a/onboarding'
import { nextOf, withNext } from '@/components/a/onboarding-form'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { requireViewer, type Viewer } from '@/lib/server/auth'

export const metadata: Metadata = { title: '기본 정보' }

const ORIGINS = ['상봉·중랑', '청량리·동대문', '잠실·송파', '구리', '하남', '의정부', '직접 입력']

function Body({ v, next }: { v: Viewer; next: string }) {
  const origin = v.origin ? (ORIGINS.includes(v.origin) ? v.origin : '직접 입력') : '상봉·중랑'
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
      <PickGroup name="origin" title="출발 권역" options={ORIGINS} initial={[origin]} />
      {/* 주로 타는 것: 저장할 칸이 아직 없다(보고함) — 화면만 */}
      <PickGroup title="주로 타는 것" options={['대중교통', '자차']} initial={['대중교통']} />
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
            <Body v={v} next={next} />
          </div>
          <DemoNote />
          <LaterNextSubmit nextLabel="다음" />
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="가입">
          <ActionForm action={onboardingAction}>
            <Body v={v} next={next} />
            <LaterNextSubmit nextLabel="다음" desktop />
          </ActionForm>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
