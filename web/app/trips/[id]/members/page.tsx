import type { Metadata } from 'next'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { loadSpace } from '@/components/trips/load'
import { MemberGrid, MemberList } from '@/components/trips/members'
import { SpaceDesktopHead, SpaceMobileHead } from '@/components/trips/space'
import { DemoNote } from '@/components/ui/primitives'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: '참여자' }

export default async function MembersPage({ params }: Props) {
  const sp = await loadSpace(params, '/members')
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead sp={sp} tab="members" />
        <MemberList sp={sp} />
        <DemoNote />
        <div className="h-8" />
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead sp={sp} tab="members" />
        <MemberGrid sp={sp} />
      </DesktopFrame>
    </>
  )
}
