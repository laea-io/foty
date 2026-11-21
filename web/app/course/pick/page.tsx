import type { Metadata } from 'next'
import { CorePick } from '@/components/course/core-pick'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { openThemeCount, places } from '@/lib/demo/courses'

export const metadata: Metadata = { title: '핵심 장소 고르기' }

export default async function CorePickPage({ searchParams }: { searchParams: Promise<{ place?: string }> }) {
  const { place } = await searchParams
  const counts = Object.fromEntries(places.map((p) => [p.id, openThemeCount(p)]))
  const head = (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        어디에 가고 싶으세요?
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        한 곳을 고르면 앞뒤로 하루 코스를 붙여 드려요.
      </div>
    </>
  )
  return (
    <>
      <MobileFrame>
        <BackBar title="핵심 장소" back={`/course${place ? `?place=${place}` : ''}`} />
        <div className="px-5">
          {head}
          <CorePick places={places} counts={counts} />
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">핵심 장소</div>
          {head}
          <CorePick places={places} counts={counts} wide />
        </div>
      </DesktopFrame>
    </>
  )
}
