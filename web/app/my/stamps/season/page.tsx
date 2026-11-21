import type { Metadata } from 'next'
import { Narrow } from '@/components/a/form'
import { StampGroup } from '@/components/a/stamps'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote, Segmented } from '@/components/ui/primitives'
import { seasons } from '@/lib/demo/stamps'

export const metadata: Metadata = { title: '계절 시리즈' }

const tabs = [
  { href: '/my/stamps', label: '권역' },
  { href: '/my/stamps/season', label: '계절 시리즈' },
]

function Body() {
  return (
    <>
      <div className="mt-2.5">
        <Segmented items={tabs} current="/my/stamps/season" />
      </div>
      {seasons.map((s) => (
        <StampGroup key={s.name} title={s.name} aside={s.aside} cells={s.cells} dim={s.closed} />
      ))}
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        계절 시리즈는 그 계절에 열린 테마에서 체크인하면 채워져요. 시리즈 구성은 예시예요.
      </div>
    </>
  )
}

export default function StampSeasonPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="스탬프북" back="/my" />
        <div className="px-5">
          <Body />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="스탬프북">
          <Body />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
