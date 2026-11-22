import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OtherDateRows, SectionHead, ThemeList } from '@/components/b/theme/flow'
import { loadTheme } from '@/components/b/theme/load'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { Badge, DemoNote } from '@/components/ui/primitives'
import { otherDates, similarThemes } from '@/lib/server/q/b-themes'

export const metadata: Metadata = { title: '이번 테마는 취소됐어요' }

/** 미성사 취소: 최소 인원이 모이지 않아 자동 취소된 테마 */
export default async function CancelledPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  // 실제로 인원 미달로 취소된 테마에서만(주소만 바꿔 들어오면 상세로)
  if (t.status !== '취소') redirect(`/themes/${t.id}`)
  if (t.cancelReason !== '최소 인원 미달') redirect(`/themes/${t.id}/host-cancelled`)
  const [dates, similar] = await Promise.all([otherDates(t), similarThemes(t)])
  const why = `${t.min}명부터 성사인데 ${t.current}명이 신청했어요.`
  return (
    <>
      <MobileFrame>
        <BackBar title="내 여행" back="/trips" />
        <div className="px-5">
          <div className="pt-7 pb-1.5">
            <Badge tone="muted">취소</Badge>
            <h1 className="mt-3 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
              최소 인원이 모이지 않아
              <br />
              이번 테마는 취소됐어요
            </h1>
            <div className="mt-2 text-[13px] text-sub">
              {t.title} · {t.date} {t.start}
              <br />
              {why}
            </div>
          </div>
          <SectionHead title="같은 테마의 다른 날짜" className="mt-7" />
          {dates.length ? (
            <OtherDateRows dates={dates} firstBorder={false} />
          ) : (
            <div className="py-[15px] text-[13px] text-sub">아직 열린 다른 날짜가 없어요.</div>
          )}
          <SectionHead title="비슷한 테마" className="mt-7" />
          <ThemeList list={similar} />
          <DemoNote />
          <div className="h-10" />
        </div>
      </MobileFrame>

      <DesktopFrame>
        <div className="flex items-start gap-16">
          <div className="min-w-0 flex-1">
            <Badge tone="muted">취소</Badge>
            <h1 className="mt-3.5 mb-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
              최소 인원이 모이지 않아
              <br />
              이번 테마는 취소됐어요
            </h1>
            <div className="mt-2 text-[15px] text-sub">
              {t.title} · {t.date} {t.start} · {why}
            </div>
            <SectionHead title="같은 테마의 다른 날짜" className="mt-10" />
            {dates.length ? (
              <OtherDateRows dates={dates} wide />
            ) : (
              <div className="border-t border-line py-4 text-[14px] text-sub">
                아직 열린 다른 날짜가 없어요.
              </div>
            )}
          </div>
          <div className="w-[440px] flex-none">
            <div className="mb-1 text-[18px] font-extrabold tracking-[-0.03em]">비슷한 테마</div>
            {similar.map((x) => (
              <ThemeRow key={x.id} t={x} />
            ))}
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
