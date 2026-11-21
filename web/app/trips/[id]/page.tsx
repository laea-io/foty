import type { Metadata } from 'next'
import { loadSpace } from '@/components/b/trips/load'
import {
  SpaceDesktopHead,
  SpaceMobileHead,
  SpacePlanDesktop,
  SpacePlanMobile,
} from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { themeDetail } from '@/lib/server/q/themes'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await themeDetail((await params).id)
  return { title: d ? `${d.theme.title} · 그룹 여행 공간` : '그룹 여행 공간' }
}

/** 그룹 여행 공간(일정) — 성사된 테마의 참여자 · 호스트만 */
export default async function SpacePage({ params }: Props) {
  const sp = await loadSpace(params)
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead sp={sp} tab="plan" />
        <SpacePlanMobile sp={sp} />
        <DemoNote />
        <div className="h-8" />
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead sp={sp} tab="plan" />
        <SpacePlanDesktop sp={sp} />
      </DesktopFrame>
    </>
  )
}
