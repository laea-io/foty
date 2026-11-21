import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminHostRow, AdminReportRow } from '@/components/a/admin-row'
import { PageTitle } from '@/components/a/form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Segmented } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/server/auth'
import { adminQueue } from '@/lib/server/q/a'

export const metadata: Metadata = { title: '운영팀' }

type Q = Awaited<ReturnType<typeof adminQueue>>

function Head({ q }: { q: Q }) {
  const tabs = [
    { href: '/admin', label: `할 일 ${q.openHosts + q.openReports}` },
    { href: '/admin#hosts', label: '호스트' },
    { href: '/admin#reports', label: '신고' },
  ]
  return (
    <>
      <PageTitle sub="호스트 확인과 신고 처리">운영팀</PageTitle>
      <div className="mt-4">
        <Segmented items={tabs} current="/admin" />
      </div>
    </>
  )
}

function Group({
  id,
  title,
  open,
  children,
}: {
  id: string
  title: string
  open: number
  children: ReactNode
}) {
  return (
    <section id={id}>
      <div className="mt-[26px] mb-2 text-[17px] font-extrabold tracking-[-0.03em]">
        {title} <span className="font-medium text-muted">{open}</span>
      </div>
      {children}
    </section>
  )
}

function Hosts({ q, id }: { q: Q; id: string }) {
  return (
    <Group id={id} title="호스트 확인" open={q.openHosts}>
      {q.hosts.map((it) => (
        <AdminHostRow key={it.id} it={it} />
      ))}
    </Group>
  )
}

function Reports({ q, id }: { q: Q; id: string }) {
  return (
    <Group id={id} title="신고 처리" open={q.openReports}>
      {q.reports.map((it) => (
        <AdminReportRow key={it.id} it={it} />
      ))}
      {!q.reports.length && (
        <div className="border-t border-line py-4 text-[13px] text-sub">들어온 신고가 없어요</div>
      )}
    </Group>
  )
}

export default async function AdminPage() {
  await requireAdmin()
  const q = await adminQueue(db)
  return (
    <>
      <MobileFrame>
        <BackBar title="운영팀" back="/my" />
        <div className="px-5 pb-10">
          <Head q={q} />
          <Hosts q={q} id="hosts" />
          <Reports q={q} id="reports" />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <Head q={q} />
        <div className="flex items-start gap-14">
          <div className="min-w-0 flex-1">
            <Hosts q={q} id="hosts-d" />
          </div>
          <div className="w-[520px] flex-none">
            <Reports q={q} id="reports-d" />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
