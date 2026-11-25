import { and, eq, isNull } from 'drizzle-orm'
import type { Metadata } from 'next'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { StopList } from '@/components/theme/parts'
import { ChatThread } from '@/components/trips/chat'
import { loadSpace } from '@/components/trips/load'
import { ChangeCard, SpaceDesktopHead, SpaceMobileHead } from '@/components/trips/space'
import { db, schema } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth/session'
import { chatMessages } from '@/lib/server/queries/trips'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: '그룹 대화' }

/** 그룹 대화 — 성사된 테마의 참여자 · 호스트만. 새 글은 SSE로 */
export default async function ChatPage({ params }: Props) {
  const sp = await loadSpace(params, '/chat')
  const viewer = await requireViewer(`/trips/${sp.t.id}/chat`)
  const t = sp.t
  const msgs = await chatMessages(t.id, viewer.id)
  // 대화를 열었으면 이 대화의 알림은 읽은 것으로(다음 새 대화 알림이 다시 올 수 있게)
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.userId, viewer.id),
        eq(schema.notifications.href, `/trips/${t.id}/chat`),
        isNull(schema.notifications.readAt),
      ),
    )
  const card = sp.change ? <ChangeCard sp={sp} from="chat" /> : null
  return (
    <>
      <MobileFrame bottom>
        <SpaceMobileHead sp={sp} tab="chat" />
        <div className="px-5">
          <ChatThread themeId={t.id} initial={msgs} card={card} />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead sp={sp} tab="chat" />
        <div className="mt-8 flex items-start gap-10">
          <div className="min-w-0 flex-1">
            <ChatThread themeId={t.id} initial={msgs} card={card} wide />
          </div>
          <div className="w-[360px] flex-none">
            <div className="text-[16px] font-extrabold tracking-[-0.03em]">
              {sp.status === '일정 확정' ? '확정된 일정' : '확정 전 일정'}
            </div>
            <StopList stops={t.stops} className="mt-1" />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
