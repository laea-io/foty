import type { Metadata } from 'next'
import { MbtiPick } from '@/components/a/chip-pick'
import { Narrow, PageTitle } from '@/components/a/form'
import { LaterNext } from '@/components/a/later-bar'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { me } from '@/lib/demo/people'

export const metadata: Metadata = { title: 'MBTI' }

function Body() {
  return (
    <>
      <PageTitle sub="자기소개에만 보여요. 테마 추천이나 사람을 고르는 데는 쓰지 않아요.">
        MBTI를 적어둘까요?
      </PageTitle>
      <MbtiPick initial={me.mbti} />
      <div className="mt-[18px]">
        <ToggleRow title="프로필에 공개" sub="끄면 나만 볼 수 있어요" />
      </div>
    </>
  )
}

export default function MbtiPage() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="MBTI" back="/onboarding/3" />
        <div className="px-5">
          <Body />
        </div>
        <DemoNote />
        <LaterNext
          laterHref="/onboarding/3"
          laterLabel="건너뛰기"
          nextHref="/onboarding/3"
          nextLabel="저장"
        />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="MBTI">
          <Body />
          <LaterNext
            laterHref="/onboarding/3"
            laterLabel="건너뛰기"
            nextHref="/onboarding/3"
            nextLabel="저장"
            desktop
          />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
