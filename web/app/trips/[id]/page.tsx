import type { Metadata } from 'next'
import { loadSpace, spaceParams } from '@/components/b/trips/load'
import {
  SpaceDesktopHead,
  SpaceMobileHead,
  SpacePlanDesktop,
  SpacePlanMobile,
} from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'

type Props = { params: Promise<{ id: string }> }

export const generateStaticParams = spaceParams

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = loadSpace((await params).id)
  return { title: `${t.title} · 그룹 여행 공간` }
}

export default async function SpacePage({ params }: Props) {
  const { s, t, change } = loadSpace((await params).id)
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead s={s} t={t} tab="plan" />
        <SpacePlanMobile t={t} change={change} />
        <DemoNote />
        <div className="h-8" />
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead s={s} t={t} tab="plan" />
        <SpacePlanDesktop t={t} change={change} />
      </DesktopFrame>
    </>
  )
}
