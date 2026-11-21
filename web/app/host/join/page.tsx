import type { Metadata } from 'next'
import { BusinessFields, JoinProgress, KindPicker } from '@/components/host/join'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '호스트 등록' }

export default function HostJoinPage() {
  const intro = (
    <div className="mt-1.5 text-[13px] text-sub">남양주의 가게·관광지·주민만 테마를 열 수 있어요.</div>
  )
  return (
    <>
      <MobileFrame>
        <BackBar title="호스트 등록" back="/my" />
        <div className="px-5">
          <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
            남양주에서 테마를 여는
            <br />
            호스트로 등록해요
          </h1>
          {intro}
          <KindPicker current="business" />
          <BusinessFields />
          <div className="mt-[26px]">
            <JoinProgress />
          </div>
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="flex items-start gap-16">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
              남양주에서 테마를 여는 호스트로 등록해요
            </h1>
            {intro}
            <KindPicker current="business" />
            <BusinessFields />
          </div>
          <div className="w-[400px] flex-none">
            <div className="mb-3 text-[16px] font-extrabold tracking-[-0.03em]">확인 진행 상태</div>
            <JoinProgress />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
