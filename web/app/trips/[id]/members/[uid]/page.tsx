import type { Metadata } from 'next'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { loadSpace, memberOf } from '@/components/trips/load'
import { CloseButton, MemberGrid, MemberList, MemberMenu } from '@/components/trips/members'
import { DesktopDialog, MobileSheet } from '@/components/trips/sheet'
import { SpaceDesktopHead, SpaceMobileHead } from '@/components/trips/space'
import { DemoNote } from '@/components/ui/primitives'

type Props = { params: Promise<{ id: string; uid: string }> }

export const metadata: Metadata = { title: '참여자' }

/** 참여자 더보기 — 모바일 바텀시트, 데스크톱 가운데 창(참여자 목록 위) */
export default async function MemberMenuPage({ params }: Props) {
  const p = await params
  const sp = await loadSpace(Promise.resolve(p), `/members/${p.uid}`)
  const m = memberOf(sp, p.uid)
  const t = sp.t
  const back = `/trips/${t.id}/members`
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead sp={sp} tab="members" />
        <MemberList sp={sp} />
        <DemoNote />
        <div className="h-8" />
        <MobileSheet title={m.name} closeHref={back} footer={<CloseButton href={back} />}>
          <MemberMenu m={m} themeId={t.id} hostId={t.hostId} />
        </MobileSheet>
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead sp={sp} tab="members" />
        <MemberGrid sp={sp} />
        <DesktopDialog title={m.name} closeHref={back}>
          <div className="flex flex-col gap-[22px]">
            <MemberMenu m={m} themeId={t.id} hostId={t.hostId} />
          </div>
        </DesktopDialog>
      </DesktopFrame>
    </>
  )
}
