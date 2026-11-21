import type { Metadata } from 'next'
import { RequestsList } from '@/components/host/requests-list'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote, Note } from '@/components/ui/primitives'
import { requireHost } from '@/lib/server/auth'
import { requestsFor } from '@/lib/server/q/c'

export const metadata: Metadata = { title: '테마 요청' }

export default async function HostRequestsPage() {
  const v = await requireHost('/host/requests')
  const list = await requestsFor(v.host.id)
  const body = (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        참여자가 남긴 테마 요청
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        내 장소와 맞는 요청을 골라 테마를 열 수 있어요.
      </div>
      <RequestsList list={list} />
      <Note className="mt-4">
        요청한 사람의 이름과 프로필은 보이지 않아요. 테마를 열면 요청한 사람에게 알림이 가요.
      </Note>
    </>
  )
  return (
    <>
      <MobileFrame>
        <BackBar title="테마 요청" back="/host" />
        <div className="px-5">
          {body}
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[680px]">
          <div className="mb-2 text-[14px] text-sub">호스트</div>
          {body}
        </div>
      </DesktopFrame>
    </>
  )
}
