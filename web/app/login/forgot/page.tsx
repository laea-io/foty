import type { Metadata } from 'next'
import { ForgotForm } from '@/components/auth/reset-forms'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Narrow, PageTitle } from '@/components/ui/parts'
import { mailReady } from '@/lib/server/services/mail'

export const metadata: Metadata = { title: '비밀번호 찾기' }

export default function ForgotPage() {
  const body = (
    <>
      <PageTitle sub="가입한 메일로 새 비밀번호를 정할 링크를 보내요.">비밀번호를 잊었어요</PageTitle>
      <ForgotForm mail={mailReady()} />
    </>
  )
  return (
    <>
      <MobileFrame>
        <BackBar title="비밀번호 찾기" back="/login" />
        <div className="px-5 pb-10">{body}</div>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="비밀번호 찾기">{body}</Narrow>
      </DesktopFrame>
    </>
  )
}
