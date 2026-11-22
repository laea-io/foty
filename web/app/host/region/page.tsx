import type { Metadata } from 'next'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote, Note, Segmented } from '@/components/ui/primitives'
import { getViewer, requireAdmin, requireHost } from '@/lib/server/auth'
import { regionSummary } from '@/lib/server/q/c'

type R = Awaited<ReturnType<typeof regionSummary>>

export const metadata: Metadata = { title: '지역 방문 요약' }

const periodsFor = (r: R) => [
  { href: '/host/region', label: `${r.months[0]}월` },
  { href: '/host/region?p=last', label: `${r.months[1]}월` },
  { href: '/host/region?p=all', label: '전체' },
]

function Bars({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <>
      <h2 className="mt-9 mb-3 text-[18px] font-extrabold tracking-[-0.04em]">{title}</h2>
      <div className="flex flex-col gap-3">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2.5">
            <span className="w-[84px] flex-none text-[13px]">{k}</span>
            <div className="h-2 flex-1 rounded-[4px] bg-face">
              <div className="h-2 rounded-[4px] bg-ink" style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <span className="w-10 text-right text-[13px] font-bold">{v}명</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Body({ current, wide, r }: { current: string; wide?: boolean; r: R }) {
  return (
    <>
      <h1
        className={`mt-4 mb-0 font-extrabold ${wide ? 'text-[30px] leading-[38px] tracking-[-0.05em]' : 'text-[22px] leading-[30px] tracking-[-0.04em]'}`}
      >
        남양주 방문 요약
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        지자체·상인회 협의용 자료예요. 숫자는 현장 체크인 기록으로 세요.
      </div>
      <div className={`mt-5 ${wide ? 'max-w-[420px]' : ''}`}>
        <Segmented items={periodsFor(r)} current={current} />
      </div>
      <div className={`mt-6 grid gap-y-6 ${wide ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {r.stats.map((s) => (
          <div key={s.label}>
            <div className="text-[34px] leading-[38px] font-extrabold tracking-[-0.05em]">
              {s.value}
              {s.unit && <span className="ml-0.5 text-[15px] font-semibold tracking-normal">{s.unit}</span>}
            </div>
            <div className="mt-1 text-[12px] text-sub">{s.label}</div>
          </div>
        ))}
      </div>
      <div className={wide ? 'grid grid-cols-2 gap-14' : ''}>
        <div>
          <Bars title="출발 권역별" rows={r.origin} />
        </div>
        <div>
          <Bars title="도착 권역별" rows={r.arrive} />
        </div>
      </div>
      <Note className="mt-5">
        방문은 핵심 장소의 현장 체크인으로만 세요. 두 개 이상 권역의 스탬프를 가진 참여자는 {r.multiRegion}
        명이에요(재방문 보조 지표). 지출과 경제 효과는 이 표에 넣지 않았어요.
      </Note>
    </>
  )
}

export default async function RegionSummaryPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  // 지역 요약은 호스트와 운영팀이 본다
  const viewer = await getViewer()
  if (viewer?.role === 'admin') await requireAdmin()
  else await requireHost('/host/region')
  const p = (await searchParams).p
  const r = await regionSummary(p === 'last' ? 'last' : p === 'all' ? 'all' : 'month')
  const current = p === 'last' ? '/host/region?p=last' : p === 'all' ? '/host/region?p=all' : '/host/region'
  return (
    <>
      <MobileFrame>
        <BackBar title="지역 요약" back="/host/summary" />
        <div className="px-5">
          <Body current={current} r={r} />
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[880px]">
          <Body current={current} wide r={r} />
        </div>
      </DesktopFrame>
    </>
  )
}
