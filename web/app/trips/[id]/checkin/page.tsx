import type { Metadata } from 'next'
import { ToggleButton } from '@/components/b/trips/actions'
import { loadSpace, spaceParams } from '@/components/b/trips/load'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Avatar, Badge, ButtonLink, Photo } from '@/components/ui/primitives'
import { displayName, guests } from '@/lib/demo/trips'

type Props = { params: Promise<{ id: string }> }

export const generateStaticParams = spaceParams
export const metadata: Metadata = { title: '현장 체크인' }

const done = guests.filter((g) => g.checkedIn).length
const note = '체크인하면 참여가 확인되고, 여행이 끝난 뒤 후기와 평가를 남길 수 있어요.'

export default async function CheckinPage({ params }: Props) {
  const { t } = loadSpace((await params).id)
  const core = t.stops.find((s) => s.fixed) ?? t.stops[0]
  const help = `/trips/${t.id}/checkin/done`
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="현장 체크인" back={`/trips/${t.id}`} />
        <div className="px-5">
          <div className="pt-2 pb-[18px]">
            <div className="text-[13px] text-sub">핵심 장소</div>
            <h1 className="mt-1 mb-0 text-[24px] font-extrabold tracking-[-0.04em]">{core.name}</h1>
          </div>
          <div className="relative h-[300px] overflow-hidden rounded-[20px] bg-ink">
            <Photo
              src={core.image.src}
              alt={core.image.alt}
              bg={core.image.bg}
              className="h-[300px] w-full opacity-[0.55]"
            />
            <div className="absolute top-1/2 left-1/2 -mt-[90px] -ml-[90px] h-[180px] w-[180px] rounded-[16px] shadow-[inset_0_0_0_3px_#ffffff]" />
            <div className="absolute inset-x-0 bottom-[18px] text-center text-[12px] text-white/85">
              호스트가 보여주는 QR을 비춰 주세요
            </div>
          </div>
          <div className="mt-7 mb-3 flex items-baseline justify-between">
            <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">체크인한 참여자</h2>
            <span className="text-[12px] text-sub">
              {done} / {guests.length}명
            </span>
          </div>
          <div className="flex">
            {guests.map((g) => (
              <div key={g.id} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="relative inline-flex">
                  <Avatar name={g.name} size={40} />
                  {g.checkedIn && (
                    <span className="absolute -right-1 -bottom-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-ink text-white">
                      <Icon name="check" size={10} weight={3} />
                    </span>
                  )}
                </span>
                <span className={`text-[11px] ${g.checkedIn ? 'text-ink' : 'text-muted'}`}>{g.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-[22px] text-[12px] leading-[18px] text-muted">{note}</div>
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink href={help} variant="outline" block className="h-[52px]">
              QR이 안 돼요 · 호스트에게 확인 요청
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>

      <DesktopFrame>
        <div className="flex items-start gap-16">
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-sub">핵심 장소</div>
            <h1 className="mt-1.5 mb-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
              {core.name}
            </h1>
            <div className="mt-2 text-[15px] text-sub">
              현장 체크인은 휴대폰에서 해요. 호스트가 보여주는 QR을 휴대폰 카메라로 비춰 주세요.
            </div>
            <div className="mt-7 flex gap-2">
              <ToggleButton
                label="내 휴대폰으로 링크 보내기"
                done="휴대폰으로 보냈어요"
                variant="primary"
                size="md"
              />
              <ButtonLink href={help} variant="outline">
                QR이 안 돼요 · 호스트에게 확인 요청
              </ButtonLink>
            </div>
            <div className="mt-5 text-[13px] text-muted">{note}</div>
          </div>
          <div className="w-[420px] flex-none">
            <div className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
              <div className="flex items-baseline justify-between">
                <span className="text-[18px] font-extrabold tracking-[-0.03em]">체크인한 참여자</span>
                <span className="text-[13px] text-sub">
                  {done} / {guests.length}명
                </span>
              </div>
              <div className="mt-3">
                {guests.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 border-t border-line py-[13px]">
                    <Avatar name={displayName(g)} size={36} />
                    <div className="grow text-[15px] font-semibold">{displayName(g)}</div>
                    {g.checkedIn ? (
                      <Badge tone="ink">체크인 완료</Badge>
                    ) : (
                      <Badge tone="muted">확인 대기</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
