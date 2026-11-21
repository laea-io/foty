import type { Metadata } from 'next'
import Link from 'next/link'
import { PickGroup, Stack, StepDots } from '@/components/a/onboarding'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ButtonLink, IconButton } from '@/components/ui/primitives'
import { activityList } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '어떤 여행을 좋아하세요?' }

const acts = { title: '관심 활동', options: activityList, initial: ['산책', '카페', '사진'], multi: true }
const pace = { title: '여행 속도', options: ['여유롭게', '적당히', '알차게'], initial: ['여유롭게'] }
const walk = { title: '걷기', options: ['조금만', '1~2시간', '많이 걸어도 좋아요'], initial: ['1~2시간'] }
const talk = {
  title: '대화 분위기',
  options: ['조용한 편', '상황에 따라', '활발한 편'],
  initial: ['상황에 따라'],
}
const plan = {
  title: '계획 성향',
  options: ['미리 정하기', '유연하게 조정하기'],
  initial: ['유연하게 조정하기'],
}

export default function OnboardingPage() {
  return (
    <>
      <MobileFrame bottom>
        <header className="flex h-[52px] items-center pr-4 pl-1.5">
          <IconButton icon="back" label="이전" href="/login" />
          <div className="flex grow justify-center">
            <StepDots step={0} />
          </div>
          <Link href="/" className="text-[13px] text-sub no-underline">
            나중에 설정
          </Link>
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
        </div>
        <div
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[560px] bg-white px-5 pt-3 lg:hidden"
          style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
        >
          <ButtonLink href="/onboarding/2" block>
            다음
          </ButtonLink>
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[560px]">
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
          <div className="mt-11 flex gap-2.5">
            <ButtonLink href="/" variant="outline" size="lg">
              나중에 설정
            </ButtonLink>
            <div className="grow">
              <ButtonLink href="/onboarding/2" size="lg" block>
                다음
              </ButtonLink>
            </div>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
