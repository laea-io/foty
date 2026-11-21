import type { Metadata } from 'next'
import { OtherDateRows, SectionHead, StatusHead, ThemeList } from '@/components/b/theme/flow'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ButtonLink } from '@/components/ui/primitives'
import { hostCancelNote, otherDates, similarThemes } from '@/lib/demo/theme-flow'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '호스트 사정으로 취소됐어요' }

export default async function HostCancelledPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  const note = hostCancelNote(t)
  const dates = otherDates(t, 'host-cancelled')
  return (
    <SimpleScreen
      title="내 여행"
      back="/trips"
      bottom={
        <div className="grow">
          <ButtonLink href={`/themes/${t.id}`} size="lg" block>
            {dates[0].label.split(' ')[0]} 날짜에 다시 신청
          </ButtonLink>
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
      <div className="mt-[18px] rounded-[14px] bg-face px-4 py-3.5 text-[14px] leading-[21px]">
        “{note.text}” <span className="text-sub">— {note.host}</span>
      </div>
      <SectionHead title="같은 테마의 다른 날짜" />
      <OtherDateRows t={t} dates={dates} />
      <SectionHead title="비슷한 테마" className="mt-7" />
      <ThemeList list={similarThemes(t, 1)} />
    </SimpleScreen>
  )
}
