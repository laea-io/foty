import type { Metadata } from 'next'
import { onboardingAction } from '@/app/actions/a'
import { ActionForm, FormError } from '@/components/a/action-form'
import { MbtiPick } from '@/components/a/chip-pick'
import { Narrow, PageTitle } from '@/components/a/form'
import { LaterNextSubmit } from '@/components/a/later-bar'
import { nextOf, withNext } from '@/components/a/onboarding-form'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { requireViewer, type Viewer } from '@/lib/server/auth'

export const metadata: Metadata = { title: 'MBTI' }

function Body({ v, next }: { v: Viewer; next: string }) {
  return (
    <>
      <input type="hidden" name="step" value="mbti" />
      {next && <input type="hidden" name="next" value={next} />}
      <PageTitle sub="자기소개에만 보여요. 테마 추천이나 사람을 고르는 데는 쓰지 않아요.">
        MBTI를 적어둘까요?
      </PageTitle>
      <MbtiPick name="mbti" initial={v.mbti ?? undefined} />
      <div className="mt-[18px]">
        <ToggleRow
          name="mbtiPublic"
          title="프로필에 공개"
          sub="끄면 나만 볼 수 있어요"
          defaultOn={v.mbtiPublic}
        />
      </div>
      <FormError className="mt-4" />
    </>
  )
}

export default async function MbtiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const next = nextOf(await searchParams)
  const v = await requireViewer(withNext('/onboarding/mbti', next))
  const back = withNext('/onboarding/3', next)
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="MBTI" back={back} />
        <ActionForm action={onboardingAction}>
          <div className="px-5">
            <Body v={v} next={next} />
          </div>
          <DemoNote />
          <LaterNextSubmit laterHref={back} laterLabel="건너뛰기" nextLabel="저장" />
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="MBTI">
          <ActionForm action={onboardingAction}>
            <Body v={v} next={next} />
            <LaterNextSubmit laterHref={back} laterLabel="건너뛰기" nextLabel="저장" desktop />
          </ActionForm>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
