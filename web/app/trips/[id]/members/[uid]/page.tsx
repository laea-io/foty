import type { Metadata } from 'next'
import { loadMember, loadSpace, spaceParams } from '@/components/b/trips/load'
import { CloseButton, MemberGrid, MemberList, MemberMenu } from '@/components/b/trips/members'
import { DesktopDialog, MobileSheet } from '@/components/b/trips/sheet'
import { SpaceDesktopHead, SpaceMobileHead } from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { members } from '@/lib/demo/trips'

type Props = { params: Promise<{ id: string; uid: string }> }

export function generateStaticParams() {
  return spaceParams().flatMap(({ id }) => members.map((m) => ({ id, uid: m.id })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: loadMember((await params).uid).name }
}

/** 참여자 더보기 — 모바일 바텀시트, 데스크톱 가운데 창(참여자 목록 위) */
export default async function MemberMenuPage({ params }: Props) {
  const p = await params
  const { s, t } = loadSpace(p.id)
  const m = loadMember(p.uid)
  const back = `/trips/${t.id}/members`
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead s={s} t={t} tab="members" />
        <MemberList id={t.id} />
        <DemoNote />
        <div className="h-8" />
        <MobileSheet title={m.name} closeHref={back} footer={<CloseButton href={back} />}>
          <MemberMenu m={m} />
        </MobileSheet>
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead s={s} t={t} tab="members" />
        <MemberGrid id={t.id} />
        <DesktopDialog title={m.name} closeHref={back}>
          <div className="flex flex-col gap-[22px]">
            <MemberMenu m={m} />
          </div>
        </DesktopDialog>
      </DesktopFrame>
    </>
  )
}
