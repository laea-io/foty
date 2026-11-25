import type { Metadata } from 'next'
import { joinHostAction } from '@/app/actions/host'
import { ActionForm } from '@/components/forms/locked-form'
import { BusinessFields, JoinProgress, KindPicker } from '@/components/host/join'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, ButtonLink, DemoNote } from '@/components/ui/primitives'
import { requireViewer } from '@/lib/server/auth/session'
import { dayLabel, today } from '@/lib/server/util/time'

export const metadata: Metadata = { title: '호스트 등록' }

export default async function HostJoinPage() {
  const v = await requireViewer('/host/join')
  const h = v.host
  const submitted = h ? dayLabel(today(h.submittedAt)) : undefined
  const intro = (
    <div className="mt-1.5 text-[13px] text-sub">남양주의 가게·관광지·주민만 테마를 열 수 있어요.</div>
  )
  const status = (
    <JoinProgress status={h?.status ?? null} submitted={submitted} kind={h?.kind ?? 'business'} />
  )
  // 이미 등록했으면 상태를 보여 주고, 아니면 가게·관광지 등록 폼
  const form = (id: string) =>
    h ? (
      <div className="mt-6 flex gap-2">
        {h.status === '확인 완료' ? (
          <ButtonLink href="/host" size="lg" block>
            내 테마로
          </ButtonLink>
        ) : (
          <ButtonLink href="/host/profile/edit" variant="outline" size="lg" block>
            제출한 정보 고치기
          </ButtonLink>
        )}
      </div>
    ) : (
      <ActionForm id={id} action={joinHostAction}>
        <BusinessFields />
        <Button type="submit" size="lg" block className="mt-6">
          확인 요청 보내기
        </Button>
      </ActionForm>
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
          {!h && <KindPicker current="business" />}
          {h ? <div className="mt-[22px]">{status}</div> : form('join-m')}
          {h && form('join-m')}
          {!h && <div className="mt-[26px]">{status}</div>}
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
            {!h && <KindPicker current="business" />}
            {h ? (
              <div className="mt-6 text-[15px] leading-6">
                <b>{h.name}</b> · {h.kind === 'business' ? '가게·관광지' : '남양주 주민'} · {h.area}
              </div>
            ) : null}
            {form('join-d')}
          </div>
          <div className="w-[400px] flex-none">
            <div className="mb-3 text-[16px] font-extrabold tracking-[-0.03em]">확인 진행 상태</div>
            {status}
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
