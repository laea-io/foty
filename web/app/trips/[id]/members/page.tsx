import type { Metadata } from 'next'
import { loadSpace, spaceParams } from '@/components/b/trips/load'
import { MemberGrid, MemberList } from '@/components/b/trips/members'
import { SpaceDesktopHead, SpaceMobileHead } from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'

type Props = { params: Promise<{ id: string }> }

export const generateStaticParams = spaceParams
export const metadata: Metadata = { title: '참여자' }

export default async function MembersPage({ params }: Props) {
  const { s, t } = loadSpace((await params).id)
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead s={s} t={t} tab="members" />
        <MemberList id={t.id} />
        <DemoNote />
        <div className="h-8" />
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead s={s} t={t} tab="members" />
        <MemberGrid id={t.id} />
      </DesktopFrame>
    </>
  )
}
