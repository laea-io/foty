import type { Metadata } from 'next'
import { Field, Narrow, PageTitle } from '@/components/a/form'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ButtonLink, DemoNote } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '이메일로 가입' }

function Form() {
  return (
    <>
      <PageTitle sub="가입하면 테마 신청과 저장을 할 수 있어요. 둘러보기는 가입 없이도 돼요.">
        이메일로 가입
      </PageTitle>
      <div className="mt-[26px] flex flex-col gap-[18px]">
        <Field label="이메일" name="email" type="email" placeholder="example@foty.kr" autoComplete="email" />
        <Field
          label="비밀번호"
          name="password"
          type="password"
          placeholder="8자 이상"
          autoComplete="new-password"
        />
        <Field
          label="비밀번호 확인"
          name="password2"
          type="password"
          placeholder="한 번 더 입력"
          autoComplete="new-password"
        />
      </div>
      <div className="mt-5">
        <ToggleRow title="이용약관 동의" sub="필수" defaultOn />
        <ToggleRow title="개인정보 처리 방침 동의" sub="필수" defaultOn />
        <ToggleRow title="새 테마 알림 받기" sub="선택 · 언제든 끌 수 있어요" />
      </div>
    </>
  )
}

export default function EmailSignupPage() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="이메일 가입" back="/login/email" />
        <div className="px-5">
          <Form />
        </div>
        <DemoNote />
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/onboarding" size="lg" block>
              가입하고 계속
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="이메일 가입">
          <Form />
          <div className="mt-8 flex gap-2.5">
            <ButtonLink href="/onboarding" size="lg" block>
              가입하고 계속
            </ButtonLink>
          </div>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
