import type { Metadata } from 'next'
import Link from 'next/link'
import { onboardingAction } from '@/app/actions/a'
import { ActionForm, FormError } from '@/components/a/action-form'
import { Narrow, PageTitle } from '@/components/a/form'
import { LaterNextSubmit } from '@/components/a/later-bar'
import { PickGroup, StepDots } from '@/components/a/onboarding'
import { nextOf, pick, withNext } from '@/components/a/onboarding-form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { DemoNote } from '@/components/ui/primitives'
import type { Prefs } from '@/lib/db/schema'
import { requireViewer } from '@/lib/server/auth'

export const metadata: Metadata = { title: '조금만 더 알려주세요' }

function Body({ p, next }: { p: Prefs; next: string }) {
  return (
    <>
      <input type="hidden" name="step" value="3" />
      {next && <input type="hidden" name="next" value={next} />}
      <div className="mt-2">
        <StepDots step={2} />
      </div>
      <PageTitle sub="테마를 정렬하고 추천 이유를 설명하는 데만 써요.">조금만 더 알려주세요</PageTitle>
      <PickGroup
        name="plan"
        title="계획 성향"
        options={['미리 정하기', '유연하게 조정하기']}
        initial={pick(p, 'plan', ['유연하게 조정하기'])}
      />
      <PickGroup
        name="walk"
        title="걷기"
        options={['조금만', '1~2시간', '많이 걸어도 좋아요']}
        initial={pick(p, 'walk', ['1~2시간'])}
      />
      <PickGroup
        name="food"
        title="식사·카페"
        options={['식사 위주', '카페 위주', '둘 다 좋아요']}
        initial={pick(p, 'food', ['둘 다 좋아요'])}
      />
      <Link
        href={withNext('/onboarding/mbti', next)}
        className="mt-7 flex items-center rounded-[16px] bg-face px-[18px] py-4 text-ink no-underline"
      >
        <span className="grow">
          <span className="block text-[14px] font-bold">MBTI도 적어둘까요?</span>
          <span className="mt-px block text-[12px] text-sub">
            선택이에요. 자기소개용이고 추천에는 쓰지 않아요
          </span>
        </span>
        <Icon name="chevron" size={18} className="text-sub" />
      </Link>
      <FormError className="mt-5" />
    </>
  )
}

export default async function Onboarding3Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const next = nextOf(await searchParams)
  const v = await requireViewer(withNext('/onboarding/3', next))
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="가입" back={withNext('/onboarding/2', next)} />
        <ActionForm action={onboardingAction}>
          <div className="px-5">
            <Body p={v.prefs} next={next} />
          </div>
          <DemoNote />
          <LaterNextSubmit nextLabel="시작하기" />
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="가입">
          <ActionForm action={onboardingAction}>
            <Body p={v.prefs} next={next} />
            <LaterNextSubmit nextLabel="시작하기" desktop />
          </ActionForm>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
