import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChipGroup, FieldLabel, SwitchRow, TextArea } from '@/components/c/form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeMini } from '@/components/theme/cards'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'
import { type Theme, themeById } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '테마 취소' }

function Body({ t }: { t: Theme }) {
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        이 테마를 취소할까요?
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        신청한 {t.current}명에게 취소 알림이 가요. 취소한 뒤에는 되돌릴 수 없어요.
      </div>
      <ThemeMini t={t} className="mt-4" />
      <FieldLabel>취소 사유</FieldLabel>
      <ChipGroup
        options={['가게 사정', '날씨', '인원이 안 모일 것 같아요', '기타']}
        defaultValue="가게 사정"
      />
      <FieldLabel htmlFor="msg" optional>
        참여자에게 전할 말
      </FieldLabel>
      <TextArea
        id="msg"
        rows={3}
        defaultValue="재료 준비가 어려워 이번 주는 열지 못하게 됐어요. 다음 주에 다시 열게요."
      />
      <div className="mt-[22px]">
        <SwitchRow
          title="다음 날짜를 바로 열기"
          desc="같은 테마를 11.28 (토)로 다시 올려요"
          defaultOn={false}
        />
      </div>
      <Note className="mt-3">최소 인원이 안 차서 자동 취소되는 경우에는 따로 취소하지 않아도 돼요.</Note>
    </>
  )
}

export default async function HostCancelPage({ params }: { params: Promise<{ id: string }> }) {
  const t = themeById((await params).id)
  if (!t) notFound()
  const buttons = (
    <>
      <ButtonLink href="/host" variant="outline" size="lg">
        돌아가기
      </ButtonLink>
      <div className="grow">
        <ButtonLink href="/host" size="lg" block>
          테마 취소하기
        </ButtonLink>
      </div>
    </>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="테마 취소" back="/host" />
        <div className="px-5">
          <Body t={t} />
          <DemoNote />
        </div>
        <BottomBar>{buttons}</BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">테마 취소</div>
          <Body t={t} />
          <div className="mt-6 flex gap-2">{buttons}</div>
        </div>
      </DesktopFrame>
    </>
  )
}
