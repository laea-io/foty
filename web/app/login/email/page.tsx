import type { Metadata } from 'next'
import Link from 'next/link'
import { Field, Narrow, PageTitle } from '@/components/a/form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ButtonLink, DemoNote } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '이메일로 로그인' }

function Form() {
  return (
    <>
      <PageTitle>이메일로 로그인</PageTitle>
      <div className="mt-[26px] flex flex-col gap-[18px]">
        <Field label="이메일" name="email" type="email" placeholder="example@foty.kr" autoComplete="email" />
        <Field
          label="비밀번호"
          name="password"
          type="password"
          placeholder="8자 이상"
          autoComplete="current-password"
        />
      </div>
      <div className="mt-3.5 flex justify-between text-[13px] text-sub">
        <a href="#find-password">비밀번호 찾기</a>
        <Link href="/signup/email" className="font-semibold text-ink">
          이메일로 가입
        </Link>
      </div>
    </>
  )
}

export default function EmailLoginPage() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="이메일로 계속하기" back="/login" />
        <div className="px-5">
          <Form />
        </div>
        <DemoNote />
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/" size="lg" block>
              로그인
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="이메일로 계속하기">
          <Form />
          <div className="mt-8 flex gap-2.5">
            <ButtonLink href="/" size="lg" block>
              로그인
            </ButtonLink>
          </div>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
