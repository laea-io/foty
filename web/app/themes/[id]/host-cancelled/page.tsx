import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OtherDateRows, SectionHead, StatusHead, ThemeList } from '@/components/b/theme/flow'
import { loadTheme } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ButtonLink } from '@/components/ui/primitives'
import { otherDates, similarThemes } from '@/lib/server/q/b-themes'

export const metadata: Metadata = { title: '호스트 사정으로 취소됐어요' }

/** 호스트 취소 — 호스트가 남긴 사유(cancelReason)를 그대로 */
export default async function HostCancelledPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  if (t.status !== '취소') redirect(`/themes/${t.id}`)
  const [dates, similar] = await Promise.all([otherDates(t), similarThemes(t, 1)])
  return (
    <SimpleScreen
      title="내 여행"
      back="/trips"
      bottom={
        <div className="grow">
          {dates[0] ? (
            <ButtonLink href={`/themes/${dates[0].id}`} size="lg" block>
              {dates[0].label.split(' ')[0]} 날짜에 다시 신청
            </ButtonLink>
          ) : (
            <ButtonLink href="/" size="lg" block>
              다른 테마 보기
            </ButtonLink>
          )}
        </div>
      }
    >
      <StatusHead
        badge="취소"
        title={
          <>
            호스트 사정으로
            <br />
            이번 테마가 취소됐어요
          </>
        }
      >
        {t.title} · {t.date} {t.start}
      </StatusHead>
      {t.cancelReason && (
        <div className="mt-[18px] rounded-[14px] bg-face px-4 py-3.5 text-[14px] leading-[21px]">
          “{t.cancelReason}” <span className="text-sub">— {t.hostName}</span>
        </div>
      )}
      <SectionHead title="같은 테마의 다른 날짜" />
      {dates.length ? (
        <OtherDateRows dates={dates} />
      ) : (
        <div className="border-t border-line py-[15px] text-[13px] text-sub">
          아직 열린 다른 날짜가 없어요.
        </div>
      )}
      <SectionHead title="비슷한 테마" className="mt-7" />
      <ThemeList list={similar} />
    </SimpleScreen>
  )
}
