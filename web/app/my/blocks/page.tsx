import type { Metadata } from 'next'
import Link from 'next/link'
import { H2, Narrow } from '@/components/a/form'
import { BlockButton } from '@/components/a/live-toggles'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Avatar, Badge, DemoNote, Segmented } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth'
import { blocksAndReports } from '@/lib/server/q/a'

export const metadata: Metadata = { title: '신고·차단 내역' }

type Data = Awaited<ReturnType<typeof blocksAndReports>>

function Empty({ children }: { children: string }) {
  return <div className="border-t border-line py-4 text-[13px] text-sub">{children}</div>
}

function Body({ d }: { d: Data }) {
  return (
    <>
      <Segmented
        current="#blocks"
        items={[
          { href: '#blocks', label: `차단 ${d.blocks.length}` },
          { href: '#reports', label: `신고 내역 ${d.reports.length}` },
        ]}
      />
      <div id="blocks" className="mt-2">
        {d.blocks.map((b) => (
          <div key={b.id} className="flex gap-3 border-t border-line py-4">
            <Avatar name={b.name} size={44} />
            <div className="min-w-0 grow">
              <div className="text-[15px] font-bold">{b.name}</div>
              <div className="mt-0.5 text-[12px] text-sub">{b.when}</div>
            </div>
            <BlockButton userId={b.id} initial off="다시 차단" on="해제" />
          </div>
        ))}
        {!d.blocks.length && <Empty>차단한 사람이 없어요</Empty>}
      </div>
      <div id="reports">
        <H2>신고 내역</H2>
      </div>
      {d.reports.map((r) => (
        <div key={r.id} className="border-t border-line py-4">
          <div className="flex justify-between">
            <span className="text-[15px] font-semibold">{r.reason}</span>
            <Badge tone={r.badge[0]}>{r.badge[1]}</Badge>
          </div>
          <div className="mt-1 text-[12px] text-sub">{r.when} · 신고 내용은 상대에게 공개되지 않아요</div>
          <Link href="/report?appeal=1" className="mt-2.5 inline-block text-[13px] text-sub">
            이의제기 · 추가 내용 보내기
          </Link>
        </div>
      ))}
      {!d.reports.length && <Empty>보낸 신고가 없어요</Empty>}
    </>
  )
}

export default async function BlocksPage() {
  const v = await requireViewer('/my/blocks')
  const d = await blocksAndReports(db, v.id)
  return (
    <>
      <MobileFrame>
        <BackBar title="신고·차단 내역" back="/my" />
        <div className="px-5">
          <Body d={d} />
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="신고·차단 내역">
          <Body d={d} />
        </Narrow>
      </DesktopFrame>
    </>
  )
}
