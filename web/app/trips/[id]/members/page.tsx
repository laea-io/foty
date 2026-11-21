import type { Metadata } from 'next'
import { loadSpace } from '@/components/b/trips/load'
import { MemberGrid, MemberList } from '@/components/b/trips/members'
import { SpaceDesktopHead, SpaceMobileHead } from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
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
