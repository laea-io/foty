import type { Metadata } from 'next'
import { Narrow, PageTitle } from '@/components/a/form'
import { ResetForm } from '@/components/a/reset-forms'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'

export const metadata: Metadata = { title: '새 비밀번호' }

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await searchParams).token ?? '').slice(0, 100)
  const body = (
    <>
      <PageTitle sub="바꾸면 다른 기기의 로그인은 모두 끝나요.">새 비밀번호를 정해요</PageTitle>
      <ResetForm token={token} />
    </>
  )
  return (
    <>
      <MobileFrame>
        <BackBar title="새 비밀번호" back="/login" />
        <div className="px-5 pb-10">{body}</div>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="새 비밀번호">{body}</Narrow>
      </DesktopFrame>
    </>
  )
}
