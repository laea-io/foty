import type { Metadata } from 'next'
import { ChatThread } from '@/components/b/trips/chat'
import { loadSpace, spaceParams } from '@/components/b/trips/load'
import { ChangeCard, SpaceDesktopHead, SpaceMobileHead } from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { StopList } from '@/components/theme/parts'

type Props = { params: Promise<{ id: string }> }

export const generateStaticParams = spaceParams
export const metadata: Metadata = { title: '그룹 대화' }

export default async function ChatPage({ params }: Props) {
  const { s, t, change } = loadSpace((await params).id)
  const card = change ? <ChangeCard id={t.id} from="chat" /> : null
  return (
    <>
      <MobileFrame bottom>
        <SpaceMobileHead s={s} t={t} tab="chat" />
        <div className="px-5">
          <ChatThread card={card} />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead s={s} t={t} tab="chat" />
        <div className="mt-8 flex items-start gap-10">
          <div className="min-w-0 flex-1">
            <ChatThread card={card} wide />
          </div>
          <div className="w-[360px] flex-none">
            <div className="text-[16px] font-extrabold tracking-[-0.03em]">
              {s.status === '일정 확정' ? '확정된 일정' : '확정 전 일정'}
            </div>
            <StopList stops={t.stops} className="mt-1" />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
