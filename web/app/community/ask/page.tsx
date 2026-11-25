import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AskForm } from '@/components/community/ask-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, DemoNote } from '@/components/ui/primitives'
import { getViewer } from '@/lib/server/auth/session'
import { corePlaces } from '@/lib/server/queries/places'

export const metadata: Metadata = { title: '질문하기' }

export default async function AskPage() {
  if (!(await getViewer())) redirect('/login?next=/community/ask')
  const places = (await corePlaces())
    .map((p) => ({ id: p.id, name: p.name, area: p.area, group: p.group }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="질문하기" back="/community" />
        <div className="px-5">
          <AskForm id="ask-m" places={places} />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="ask-m" size="lg" block>
              질문 올리기
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">질문하기</div>
          <AskForm id="ask-d" places={places} />
          <div className="mt-6">
            <Button type="submit" form="ask-d" size="lg" block>
              질문 올리기
            </Button>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
