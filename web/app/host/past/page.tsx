import type { Metadata } from 'next'
import Link from 'next/link'
import { HostHeadDesktop, HostHeadMobile } from '@/components/host/host-head'
import { BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Badge, ButtonLink, DemoNote, Photo } from '@/components/ui/primitives'
import { requireHost } from '@/lib/server/auth'
import { hostSummary, hostThemes } from '@/lib/server/q/c'
import type { ThemeView } from '@/lib/server/q/themes'

export const metadata: Metadata = { title: '호스트 — 지난 테마' }

function List({ past, visits }: { past: ThemeView[]; visits: Map<string, number> }) {
  if (!past.length)
    return <div className="py-10 text-center text-[13px] text-sub">아직 지난 테마가 없어요</div>
  return (
    <div className="mt-4">
      {past.map((p) => {
        const done = p.status === '여행 완료'
        const n = visits.get(p.id) ?? 0
        return (
          <div key={p.id} className="flex gap-3.5 border-t border-line py-[18px] first:border-t-0">
            <Link href={`/themes/${p.id}`} className="contents text-ink no-underline">
              <Photo
                src={p.image.src}
                alt={p.image.alt}
                bg={p.image.bg}
                className="h-16 w-16 rounded-[12px]"
              />
            </Link>
            <div className="min-w-0 grow">
              <Badge tone={done ? 'soft' : 'muted'}>{p.status}</Badge>
              <div className="mt-[5px] truncate text-[15px] font-semibold tracking-[-0.02em]">{p.title}</div>
              <div className="mt-0.5 text-[12px] text-sub">
                {p.date} {p.start} · {p.place}
              </div>
              <div className={`mt-1.5 text-[12px] ${done ? 'font-semibold text-ink' : 'text-muted'}`}>
                {done
                  ? `${n}명 방문`
                  : p.cancelReason === '최소 인원 미달'
                    ? `최소 ${p.min}명 중 ${p.current}명 · 자동 취소됐어요`
                    : `취소 · ${p.cancelReason ?? ''}`}
              </div>
              {done && (
                <Link
                  href={`/host/themes/${p.id}/review`}
                  className="mt-2 inline-block text-[13px] font-semibold text-ink no-underline"
                >
                  참여자 평가 ›
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function HostPastPage() {
  const v = await requireHost('/host/past')
  const [mine, sum] = await Promise.all([hostThemes(v.host.id), hostSummary(v.host.id, 'all')])
  const n = { recruiting: mine.recruiting.length, matched: mine.matched.length, past: mine.past.length }
  const visits = new Map(sum.rows.map((r) => [r.id, r.visitors]))
  const last = mine.past.find((p) => p.status === '여행 완료') ?? mine.past[0]
  const add = last && (
    <ButtonLink href={`/host/themes/${last.id}/add-date`} variant="outline" size="lg" icon="plus" block>
      같은 테마 날짜 추가
    </ButtonLink>
  )
  return (
    <>
      <MobileFrame bottom={!!add}>
        <HostHeadMobile current="/host/past" n={n} />
        <div className="px-5">
          <List past={mine.past} visits={visits} />
          <DemoNote />
        </div>
        {add && (
          <BottomBar>
            <div className="grow">{add}</div>
          </BottomBar>
        )}
      </MobileFrame>
      <DesktopFrame>
        <HostHeadDesktop current="/host/past" n={n} />
        <div className="max-w-[720px]">
          <List past={mine.past} visits={visits} />
          {add && <div className="mt-4 max-w-[320px]">{add}</div>}
        </div>
      </DesktopFrame>
    </>
  )
}
