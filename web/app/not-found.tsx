import type { Metadata } from 'next'
import { BackBar } from '@/components/shell/mobile'
import { ButtonLink } from '@/components/ui/primitives'
import { ErrorBody, StateFrame } from '@/components/ui/states'

export const metadata: Metadata = { title: '화면을 찾을 수 없어요' }

export default function NotFound() {
  return (
    <StateFrame top={<BackBar title="foty" back="/" />}>
      <ErrorBody
        mascot
        title="화면을 찾을 수 없어요"
        body="주소가 바뀌었거나 없어진 화면이에요."
        actions={
          <>
            <ButtonLink href="/" className="h-[52px]">
              홈으로 가기
            </ButtonLink>
            <ButtonLink href="/search" variant="outline" className="h-[52px]">
              테마 검색하기
            </ButtonLink>
          </>
        }
      />
    </StateFrame>
  )
}
