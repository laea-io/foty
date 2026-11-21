import type { Metadata } from 'next'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
import { ActionForm, FormError } from '@/components/a/action-form'
import { Field, Narrow, PageTitle } from '@/components/a/form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, DemoNote } from '@/components/ui/primitives'
import { safeNext } from '@/lib/server/auth'

export const metadata: Metadata = { title: '이메일로 로그인' }

function Form({ next }: { next: string }) {
  const q = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <>
      <PageTitle>이메일로 로그인</PageTitle>
      {next !== '/' && <input type="hidden" name="next" value={next} />}
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
        <Link href={`/signup/email${q}`} className="font-semibold text-ink">
          이메일로 가입
        </Link>
      </div>
    </>
  )
}

export default async function EmailLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = (await searchParams).next
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw)
  return (
    <>
      <MobileFrame bottom>
        <BackBar
          title="이메일로 계속하기"
          back={next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
        />
        <ActionForm action={loginAction}>
          <div className="px-5">
            <Form next={next} />
            <FormError className="mt-5" />
          </div>
          <DemoNote />
          <BottomBar>
            <div className="grow">
              <Button type="submit" size="lg" block>
                로그인
              </Button>
            </div>
          </BottomBar>
        </ActionForm>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="이메일로 계속하기">
          <ActionForm action={loginAction}>
            <Form next={next} />
            <FormError className="mt-6" />
            <div className="mt-8 flex gap-2.5">
              <Button type="submit" size="lg" block>
                로그인
              </Button>
            </div>
          </ActionForm>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
