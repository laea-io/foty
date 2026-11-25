import type { Metadata } from 'next'
import { onboardingAction } from '@/app/actions/account'
import { ActionForm, FormError } from '@/components/forms/action-form'
import { PickGroup, Stack, StepDots } from '@/components/onboarding/onboarding'
import { nextOf, pick, withNext } from '@/components/onboarding/onboarding-form'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, IconButton } from '@/components/ui/primitives'
import type { Prefs } from '@/lib/db/schema'
import { requireViewer } from '@/lib/server/auth/session'
import { activityList } from '@/lib/shared/theme'

export const metadata: Metadata = { title: '어떤 여행을 좋아하세요?' }

function groups(p: Prefs) {
  return {
    acts: {
      name: 'activities',
      title: '관심 활동',
      options: activityList,
      initial: pick(p, 'activities', ['산책', '카페', '사진']),
      multi: true,
    },
    pace: {
      name: 'pace',
      title: '여행 속도',
      options: ['여유롭게', '적당히', '알차게'],
      initial: pick(p, 'pace', ['여유롭게']),
    },
    walk: {
      name: 'walk',
      title: '걷기',
      options: ['조금만', '1~2시간', '많이 걸어도 좋아요'],
      initial: pick(p, 'walk', ['1~2시간']),
    },
    talk: {
      name: 'talk',
      title: '대화 분위기',
      options: ['조용한 편', '상황에 따라', '활발한 편'],
      initial: pick(p, 'talk', ['상황에 따라']),
    },
    plan: {
      name: 'plan',
      title: '계획 성향',
      options: ['미리 정하기', '유연하게 조정하기'],
      initial: pick(p, 'plan', ['유연하게 조정하기']),
    },
  }
}

const skipText = 'inline-flex h-11 items-center border-0 bg-transparent p-0 text-[13px] text-sub no-underline'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const next = nextOf(await searchParams)
  const v = await requireViewer(withNext('/onboarding', next))
  const { acts, pace, walk, talk, plan } = groups(v.prefs)
  const hidden = (
    <>
      <input type="hidden" name="step" value="1" />
      {next && <input type="hidden" name="next" value={next} />}
    </>
  )
  return (
    <>
      <MobileFrame bottom>
        <ActionForm action={onboardingAction}>
          {hidden}
          <header className="flex h-[52px] items-center pr-4 pl-1.5">
            <IconButton icon="back" label="이전" href={next || '/login'} />
            <div className="flex grow justify-center">
              <StepDots step={0} />
            </div>
            <button type="submit" name="skip" value="1" className={skipText}>
              나중에 설정
            </button>
          </header>
          <div className="px-5">
            <h1 className="mt-3.5 mb-1 text-[24px] leading-[31px] font-extrabold tracking-[-0.05em]">
              어떤 여행을 좋아하세요?
            </h1>
            <div className="text-[13px] text-sub">맞는 테마를 먼저 보여드려요. 언제든 바꿀 수 있어요.</div>
            <Stack gap={24} className="mt-7">
              {[acts, pace, walk, talk].map((g) => (
                <PickGroup key={g.title} small {...g} />
              ))}
            </Stack>
            <FormError className="mt-5" />
          </div>
          <div
            className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[560px] bg-white px-5 pt-3 lg:hidden"
            style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
          >
            <Button type="submit" block>
              다음
            </Button>
          </div>
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <ActionForm action={onboardingAction} className="mx-auto max-w-[560px]">
          {hidden}
          <StepDots step={0} wide />
          <div className="mt-7">
            <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
              어떤 여행을 좋아하세요?
            </h1>
            <div className="mt-2 text-[15px] text-sub">
              맞는 테마를 먼저 보여드려요. 언제든 바꿀 수 있어요.
            </div>
          </div>
          <Stack gap={28} className="mt-9">
            {[acts, pace, talk, plan].map((g) => (
              <PickGroup key={g.title} small {...g} />
            ))}
          </Stack>
          <FormError className="mt-6" />
          <div className="mt-11 flex gap-2.5">
            <Button type="submit" name="skip" value="1" variant="outline" size="lg">
              나중에 설정
            </Button>
            <div className="grow">
              <Button type="submit" size="lg" block>
                다음
              </Button>
            </div>
          </div>
        </ActionForm>
      </DesktopFrame>
    </>
  )
}
