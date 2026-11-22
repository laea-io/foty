import type { Metadata } from 'next'
import { changePasswordAction, deleteAccountAction } from '@/app/actions/a'
import { ActionForm, FormError } from '@/components/a/action-form'
import { Field, H2, Narrow, PageTitle } from '@/components/a/form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button } from '@/components/ui/primitives'
import { requireViewer, type Viewer } from '@/lib/server/auth'

export const metadata: Metadata = { title: '계정' }

type SP = Promise<{ pw?: string }>

function Body({ v, saved }: { v: Viewer; saved: boolean }) {
  const hasPw = !!v.passwordHash
  const via = [v.email ? `이메일 ${v.email}` : null, v.kakaoId ? '카카오 로그인' : null]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <PageTitle sub={via || undefined}>계정</PageTitle>

      <H2>{hasPw ? '비밀번호 바꾸기' : '비밀번호 정하기'}</H2>
      {!hasPw && (
        <p className="mt-0 mb-3 text-[13px] leading-5 text-sub">
          카카오로만 로그인하고 있어요. 비밀번호를 정해 두면{v.email ? ' 이메일로도' : ''} 로그인할 수 있어요.
        </p>
      )}
      {saved && (
        <p role="status" className="mt-0 mb-3 rounded-[12px] bg-face px-3.5 py-2.5 text-[13px] text-ink">
          비밀번호를 저장했어요
        </p>
      )}
      <ActionForm action={changePasswordAction} className="flex flex-col gap-3">
        {hasPw && (
          <Field label="지금 비밀번호" name="current" type="password" autoComplete="current-password" />
        )}
        <Field
          label="새 비밀번호"
          name="next"
          type="password"
          placeholder="8자 이상"
          autoComplete="new-password"
        />
        <Field label="새 비밀번호 확인" name="next2" type="password" autoComplete="new-password" />
        <FormError />
        <Button type="submit" size="md" block>
          {hasPw ? '비밀번호 바꾸기' : '비밀번호 정하기'}
        </Button>
      </ActionForm>

      <H2>탈퇴</H2>
      <div className="rounded-[16px] px-[18px] py-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <ul className="m-0 flex list-disc flex-col gap-1 pl-4 text-[13px] leading-5 text-sub">
          <li>이름·이메일·카카오 연결·성향이 지워지고 되돌릴 수 없어요</li>
          <li>앞으로 갈 테마의 신청은 취소되고, 성사된 그룹에는 빠졌다고 알려요</li>
          <li>남긴 후기와 대화는 ‘탈퇴한 사용자’로 남아요</li>
          {v.host && <li>호스트로 연 앞으로의 테마는 취소되고 호스트 권한이 멈춰요</li>}
        </ul>
        <ActionForm action={deleteAccountAction} className="mt-4 flex flex-col gap-3">
          <Field
            label="확인을 위해 ‘탈퇴’라고 적어 주세요"
            name="confirm"
            placeholder="탈퇴"
            autoComplete="off"
          />
          <FormError />
          <Button type="submit" variant="outline" size="md" block>
            탈퇴하기
          </Button>
        </ActionForm>
      </div>
    </>
  )
}

export default async function AccountPage({ searchParams }: { searchParams: SP }) {
  const v = await requireViewer('/my/account')
  const saved = (await searchParams).pw === '1'
  return (
    <>
      <MobileFrame>
        <BackBar title="계정" back="/my" />
        <div className="px-5 pb-12">
          <Body v={v} saved={saved} />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="마이 · 계정">
          <Body v={v} saved={saved} />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
