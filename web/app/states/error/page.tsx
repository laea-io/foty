import type { Metadata } from 'next'
import { ErrorBody, StateFrame } from '@/components/a/states'
import { BackBar } from '@/components/shell/mobile'
import { ButtonLink } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '신청을 보내지 못했어요' }

/** 시연: 참여 신청 중 연결이 끊긴 경우(디자인 Error) */
export default function ErrorDemoPage() {
  const theme = '/themes/dasan-lunch'
  return (
    <StateFrame top={<BackBar title="참여 신청" back={theme} />} eyebrow="참여 신청">
      <ErrorBody
        title="신청을 보내지 못했어요"
        body="연결이 잠시 끊겼어요. 적어 둔 한마디는 그대로 있어요."
        actions={
          <>
            <ButtonLink href={`${theme}/applied`} className="h-[52px]">
              다시 시도
            </ButtonLink>
            <ButtonLink href={theme} variant="outline" className="h-[52px]">
              테마로 돌아가기
            </ButtonLink>
          </>
        }
      />
    </StateFrame>
  )
}
