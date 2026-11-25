import type { Metadata } from 'next'
import Link from 'next/link'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Badge, DemoNote, Note, Segmented } from '@/components/ui/primitives'
import { requireHost } from '@/lib/server/auth/session'
import { hostSummary } from '@/lib/server/queries/host'

type Sum = Awaited<ReturnType<typeof hostSummary>>

export const metadata: Metadata = { title: '방문 요약' }

const periods = [
  { href: '/host/summary', label: '이번 달' },
  { href: '/host/summary?p=last', label: '지난 달' },
  { href: '/host/summary?p=all', label: '전체' },
]

function Stats({ wide, stats }: { wide?: boolean; stats: Sum['stats'] }) {
  return (
    <div className={`grid gap-y-6 ${wide ? 'grid-cols-4' : 'grid-cols-2'} mt-6`}>
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-[34px] leading-[38px] font-extrabold tracking-[-0.05em]">
            {s.value}
            {s.unit && <span className="ml-0.5 text-[15px] font-semibold tracking-normal">{s.unit}</span>}
          </div>
          <div className="mt-1 text-[12px] text-sub">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function Rows({ rows }: { rows: Sum['rows'] }) {
  return (
    <>
      <h2 className="mt-9 mb-3 text-[18px] font-extrabold tracking-[-0.04em]">테마별</h2>
      {!rows.length && (
        <div className="border-t border-line py-6 text-center text-[13px] text-sub">
          이 기간에 끝난 테마가 없어요
        </div>
      )}
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3 border-t border-line py-3.5">
          <div className="min-w-0 grow">
            <div className="truncate text-[15px] font-semibold">{r.title}</div>
            <div className="mt-0.5 text-[12px] text-sub">
              {r.when} · {r.cap}
            </div>
          </div>
          {r.status === '취소' ? (
            <Badge tone="muted">미성사</Badge>
          ) : (
            <span className="text-[14px] font-bold">{r.visitors}명 방문</span>
          )}
        </div>
      ))}
      <Link
        href="/host/region"
        className="mt-5 flex items-center justify-between rounded-[16px] bg-face px-[18px] py-4 text-[14px] font-bold text-ink no-underline"
      >
        남양주 전체 방문 요약 보기 <span className="font-normal text-sub">›</span>
      </Link>
      <Note className="mt-4">방문은 현장 체크인으로만 세요. 신청이나 저장은 방문으로 집계하지 않아요.</Note>
    </>
  )
}

export default async function HostSummaryPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const v = await requireHost('/host/summary')
  const p = (await searchParams).p
  const current = p === 'last' ? periods[1].href : p === 'all' ? periods[2].href : periods[0].href
  const sum = await hostSummary(v.host.id, p === 'last' ? 'last' : p === 'all' ? 'all' : 'month')
  return (
    <>
      <MobileFrame>
        <BackBar title="방문 요약" back="/host" />
        <div className="px-5">
          <div className="mt-2">
            <Segmented items={periods} current={current} />
          </div>
          <Stats stats={sum.stats} />
          <Rows rows={sum.rows} />
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[880px]">
          <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">방문 요약</h1>
          <div className="mt-5 max-w-[420px]">
            <Segmented items={periods} current={current} />
          </div>
          <Stats wide stats={sum.stats} />
          <Rows rows={sum.rows} />
        </div>
      </DesktopFrame>
    </>
  )
}
