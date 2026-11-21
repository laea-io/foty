import type { Metadata } from 'next'
import { AdminRow } from '@/components/a/admin-row'
import { PageTitle } from '@/components/a/form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Segmented } from '@/components/ui/primitives'
import { type AdminItem, hostChecks, reportChecks } from '@/lib/demo/admin'

export const metadata: Metadata = { title: '운영팀' }

const tabs = [
  { href: '/admin', label: '할 일 3' },
  { href: '/admin#hosts', label: '호스트' },
  { href: '/admin#reports', label: '신고' },
]

function Head() {
  return (
    <>
      <PageTitle sub="호스트 확인과 신고 처리 · 시연용 예시">운영팀</PageTitle>
      <div className="mt-4">
        <Segmented items={tabs} current="/admin" />
      </div>
    </>
  )
}

function Group({ id, title, items }: { id: string; title: string; items: AdminItem[] }) {
  const open = items.filter((i) => i.after).length
  return (
    <section id={id}>
      <div className="mt-[26px] mb-2 text-[17px] font-extrabold tracking-[-0.03em]">
        {title} <span className="font-medium text-muted">{open}</span>
      </div>
      {items.map((it) => (
        <AdminRow key={it.id} it={it} />
      ))}
    </section>
  )
}

export default function AdminPage() {
  return (
    <>
      <MobileFrame>
        <BackBar title="운영팀" back="/my" />
        <div className="px-5 pb-10">
          <Head />
          <Group id="hosts" title="호스트 확인" items={hostChecks} />
          <Group id="reports" title="신고 처리" items={reportChecks} />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <Head />
        <div className="flex items-start gap-14">
          <div className="min-w-0 flex-1">
            <Group id="hosts-d" title="호스트 확인" items={hostChecks} />
          </div>
          <div className="w-[520px] flex-none">
            <Group id="reports-d" title="신고 처리" items={reportChecks} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
