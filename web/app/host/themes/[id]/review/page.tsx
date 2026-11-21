import type { Metadata } from 'next'
import { HostReviewForm } from '@/components/host/review-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '참여자 평가' }

const rows = [
  { id: 'yuna', name: '유나', checked: true },
  { id: 'jiho', name: '지호', checked: true },
  { id: 'kanghyun', name: '강현', checked: true, first: true },
  { id: 'dohyun', name: '도현', checked: false },
]

function Body() {
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        참여자들은 어땠나요?
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        체크인한 참여자만 평가할 수 있어요. 해당하는 것만 골라 주세요.
      </div>
      <HostReviewForm rows={rows} />
      <Note className="mt-3">
        평가는 서로 제출했거나 평가 기간이 끝난 뒤에 반영돼요. 외모·말수 같은 취향은 평가 항목이 아니에요.
      </Note>
    </>
  )
}

export default function HostReviewPage() {
  const buttons = (
    <>
      <ButtonLink href="/report" variant="outline" size="lg">
        신고하기
      </ButtonLink>
      <div className="grow">
        <ButtonLink href="/host/past" size="lg" block>
          평가 보내기
        </ButtonLink>
      </div>
    </>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="평가" back="/host/past" />
        <div className="px-5">
          <Body />
          <DemoNote />
        </div>
        <BottomBar>{buttons}</BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">평가</div>
          <Body />
          <div className="mt-6 flex gap-2">{buttons}</div>
        </div>
      </DesktopFrame>
    </>
  )
}
