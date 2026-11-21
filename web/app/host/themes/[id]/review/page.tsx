import type { Metadata } from 'next'
import { HostReviewForm } from '@/components/host/review-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, ButtonLink, DemoNote, Note } from '@/components/ui/primitives'
import { reviewRows } from '@/lib/server/q/c'
import { ownTheme } from '@/lib/server/q/own'

export const metadata: Metadata = { title: '참여자 평가' }

export default async function HostReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await ownTheme(id, `/host/themes/${id}/review`)
  const rows = await reviewRows(t.id)
  const body = (form: string) => (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        참여자들은 어땠나요?
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        {t.title} · {t.date}
        <br />
        체크인한 참여자만 평가할 수 있어요. 해당하는 것만 골라 주세요.
      </div>
      <HostReviewForm id={form} themeId={t.id} rows={rows} />
      <Note className="mt-3">
        평가는 서로 제출했거나 평가 기간이 끝난 뒤에 반영돼요. 외모·말수 같은 취향은 평가 항목이 아니에요.
      </Note>
    </>
  )
  const buttons = (form: string) => (
    <>
      <ButtonLink href="/report" variant="outline" size="lg">
        신고하기
      </ButtonLink>
      <div className="grow">
        <Button type="submit" form={form} size="lg" block disabled={t.status !== '여행 완료'}>
          평가 보내기
        </Button>
      </div>
    </>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="평가" back="/host/past" />
        <div className="px-5">
          {body('rev-m')}
          <DemoNote />
        </div>
        <BottomBar>{buttons('rev-m')}</BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">평가</div>
          {body('rev-d')}
          <div className="mt-6 flex gap-2">{buttons('rev-d')}</div>
        </div>
      </DesktopFrame>
    </>
  )
}
