import type { Metadata } from 'next'
import Link from 'next/link'
import { Narrow, PageTitle } from '@/components/a/form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { desktopNotices, type Notice, notices } from '@/lib/demo/notifications'

export const metadata: Metadata = { title: '알림' }

function List({ items }: { items: Notice[] }) {
  return (
    <>
      <PageTitle>알림</PageTitle>
      <div className="mt-4">
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
      </div>
    </>
  )
}

export default function NotificationsPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="알림" back="/" />
        <div className="px-5">
          <List items={notices} />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="알림">
          <List items={desktopNotices} />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
