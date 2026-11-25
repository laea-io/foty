import type { Metadata } from 'next'
import Link from 'next/link'
import { MarkAllRead } from '@/components/my/live-toggles'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Narrow, PageTitle } from '@/components/ui/parts'
import { DemoNote } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth/session'
import { notificationsOf } from '@/lib/server/queries/my'

type Notice = Awaited<ReturnType<typeof notificationsOf>>[number]

export const metadata: Metadata = { title: '알림' }

function List({ items, more }: { items: Notice[]; more?: number }) {
  return (
    <>
      <PageTitle>알림</PageTitle>
      <div className="mt-4">
        {!items.length && (
          <div className="border-t border-line py-4 text-[13px] text-sub">아직 받은 알림이 없어요</div>
        )}
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            className="flex gap-3 border-t border-line py-4 text-ink no-underline"
          >
            <span
              className={`mt-[7px] h-2 w-2 flex-none rounded-full ${n.unread ? 'bg-accent' : 'bg-transparent'}`}
            >
              {n.unread && <span className="sr-only">읽지 않음</span>}
            </span>
            <span className="grow">
              <span className={`block text-[15px] ${n.unread ? 'font-bold' : 'font-medium'}`}>{n.title}</span>
              <span className="mt-0.5 block text-[13px] text-sub">{n.body}</span>
              <span className="mt-1 block text-[11px] text-muted">{n.when}</span>
            </span>
          </Link>
        ))}
        {more && (
          <Link
            href={`/notifications?n=${more}`}
            scroll={false}
            className="mt-2 flex h-12 items-center justify-center rounded-[14px] text-[14px] font-semibold text-ink no-underline shadow-[inset_0_0_0_1px_var(--color-line-2)]"
          >
            지난 알림 더 보기
          </Link>
        )}
      </div>
    </>
  )
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const v = await requireViewer('/notifications')
  const n = Math.min(Math.max(Number((await searchParams).n) || 30, 30), 300)
  const all = await notificationsOf(db, v.id, new Date(), n + 1)
  const notices = all.slice(0, n)
  const more = all.length > n ? n + 30 : undefined
  return (
    <>
      <MarkAllRead any={notices.some((n) => n.unread)} />
      <MobileFrame>
        <BackBar title="알림" back="/" />
        <div className="px-5">
          <List items={notices} more={more} />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="알림">
          <List items={notices} more={more} />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
