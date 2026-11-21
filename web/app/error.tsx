'use client'

import { useEffect } from 'react'
import { ErrorBody, StateFrame } from '@/components/a/states'
import { BackBar } from '@/components/shell/mobile'
import { Button, ButtonLink } from '@/components/ui/primitives'

/** 화면을 그리다 오류가 났을 때(디자인 Error의 모양) */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <StateFrame top={<BackBar title="오류" />} eyebrow="오류">
      <ErrorBody
        title="화면을 불러오지 못했어요"
        body="연결이 잠시 끊겼어요. 잠시 뒤 다시 시도해 주세요."
        actions={
          <>
            <Button onClick={reset} className="h-[52px]">
              다시 시도
            </Button>
            <ButtonLink href="/" variant="outline" className="h-[52px]">
              홈으로 돌아가기
            </ButtonLink>
          </>
        }
      />
    </StateFrame>
  )
}
