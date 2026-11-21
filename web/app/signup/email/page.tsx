import type { Metadata } from 'next'
import { signupFormAction } from '@/app/actions/a'
import { ActionForm, FormError } from '@/components/a/action-form'
import { Field, Narrow, PageTitle } from '@/components/a/form'
import { ToggleRow } from '@/components/a/toggle'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, DemoNote } from '@/components/ui/primitives'
import { safeNext } from '@/lib/server/auth'

export const metadata: Metadata = { title: '이메일로 가입' }

function Form({ next }: { next: string }) {
  return (
    <>
      <PageTitle sub="가입하면 테마 신청과 저장을 할 수 있어요. 둘러보기는 가입 없이도 돼요.">
        이메일로 가입
      </PageTitle>
      {next !== '/' && <input type="hidden" name="next" value={next} />}
      <div className="mt-[26px] flex flex-col gap-[18px]">
        <Field label="닉네임" name="name" placeholder="여행에서 불릴 이름" autoComplete="nickname" />
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
        <ToggleRow name="adult" title="만 19세 이상이에요" sub="필수 · foty는 성인만 이용할 수 있어요" />
        <ToggleRow name="terms" title="이용약관 동의" sub="필수" defaultOn />
        <ToggleRow name="privacy" title="개인정보 처리 방침 동의" sub="필수" defaultOn />
        <ToggleRow name="alerts" title="새 테마 알림 받기" sub="선택 · 언제든 끌 수 있어요" />
      </div>
    </>
  )
}

export default async function EmailSignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = (await searchParams).next
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw)
  const back = next !== '/' ? `/login/email?next=${encodeURIComponent(next)}` : '/login/email'
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="이메일 가입" back={back} />
        <ActionForm action={signupFormAction}>
          <div className="px-5">
            <Form next={next} />
            <FormError className="mt-4" />
          </div>
          <DemoNote />
          <BottomBar>
            <div className="grow">
              <Button type="submit" size="lg" block>
                가입하고 계속
              </Button>
            </div>
          </BottomBar>
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="이메일 가입">
          <ActionForm action={signupFormAction}>
            <Form next={next} />
            <FormError className="mt-4" />
            <div className="mt-8 flex gap-2.5">
              <Button type="submit" size="lg" block>
                가입하고 계속
              </Button>
            </div>
          </ActionForm>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
