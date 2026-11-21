import type { Metadata } from 'next'
import { DraftTools } from '@/components/host/draft-tools'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { MapSketch, StopList } from '@/components/theme/parts'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'
import { hostThemes } from '@/lib/demo/host'

export const metadata: Metadata = { title: '코스 초안' }

const t = hostThemes.recruiting
const unchecked = t.stops.filter((s) => !s.checked).map((s) => s.name)

function Facts({ wide }: { wide?: boolean }) {
  const items = [
    ['날짜', t.date],
    ['총 시간', '5시간'],
    ['인원', `${t.min}~${t.max}명`],
    ['이동', '대중교통'],
  ]
  return (
    <div className="mt-4 flex border-y border-line py-3.5">
      {items.map(([k, v]) => (
        <div key={k} className="flex-1">
          <div className={`text-muted ${wide ? 'text-[12px]' : 'text-[11px]'}`}>{k}</div>
          <div className={`mt-0.5 font-bold ${wide ? 'text-[15px]' : 'text-[14px]'}`}>{v}</div>
        </div>
      ))}
    </div>
  )
}

const note = (
  <Note className="mt-3">
    핵심 장소의 시간과 위치는 고정돼요.
    {unchecked.length > 0 &&
      ` ${unchecked.join(', ')}의 운영 정보는 확인되지 않았어요. 게시 전에 한 번 확인해 주세요.`}
  </Note>
)

export default function HostDraftPage() {
  const lead = (
    <div className="mt-1.5 text-[13px] leading-5 text-sub">초안이에요. 고치거나 그대로 게시할 수 있어요.</div>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="코스 초안" back="/host/new" />
        <div className="px-5">
          <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
            {t.place} 앞뒤로
            <br />
            이런 코스를 붙였어요
          </h1>
          {lead}
          <Facts />
          <StopList stops={t.stops} className="mt-1" />
          <div className="mt-2">
            <DraftTools />
          </div>
          {note}
          <DemoNote />
        </div>
        <BottomBar>
          <ButtonLink href="/host/new" variant="outline" size="lg">
            다시 만들기
          </ButtonLink>
          <div className="grow">
            <ButtonLink href="/host" size="lg" block>
              이대로 게시하기
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
          {t.place} 앞뒤로 이런 코스를 붙였어요
        </h1>
        {lead}
        <div className="mt-7 flex items-start gap-10">
          <div className="w-[480px] flex-none">
            <Facts wide />
            <StopList stops={t.stops} className="mt-1" />
            <div className="mt-2">
              <DraftTools />
            </div>
            {note}
            <div className="mt-6 flex gap-2">
              <ButtonLink href="/host/new" variant="outline" size="lg">
                다시 만들기
              </ButtonLink>
              <div className="grow">
                <ButtonLink href="/host" size="lg" block>
                  이대로 게시하기
                </ButtonLink>
              </div>
            </div>
          </div>
          <div className="sticky top-6 min-w-0 flex-1">
            <MapSketch count={t.stops.length} height={600} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
