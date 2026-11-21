import type { Metadata } from 'next'
import Link from 'next/link'
import { Narrow, PageTitle } from '@/components/a/form'
import { LaterNext } from '@/components/a/later-bar'
import { PickGroup, StepDots } from '@/components/a/onboarding'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { DemoNote } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '조금만 더 알려주세요' }

function Body() {
  return (
    <>
      <div className="mt-2">
        <StepDots step={2} />
      </div>
      <PageTitle sub="테마를 정렬하고 추천 이유를 설명하는 데만 써요.">조금만 더 알려주세요</PageTitle>
      <PickGroup
        title="계획 성향"
        options={['미리 정하기', '유연하게 조정하기']}
        initial={['유연하게 조정하기']}
      />
      <PickGroup title="걷기" options={['조금만', '1~2시간', '많이 걸어도 좋아요']} initial={['1~2시간']} />
      <PickGroup
        title="식사·카페"
        options={['식사 위주', '카페 위주', '둘 다 좋아요']}
        initial={['둘 다 좋아요']}
      />
      <Link
        href="/onboarding/mbti"
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
    </>
  )
}

export default function Onboarding3Page() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="가입" back="/onboarding/2" />
        <div className="px-5">
          <Body />
        </div>
        <DemoNote />
        <LaterNext nextHref="/" nextLabel="시작하기" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="가입">
          <Body />
          <LaterNext nextHref="/" nextLabel="시작하기" desktop />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
