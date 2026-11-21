import type { Metadata } from 'next'
import { SectionHead, StatusHead, ThemeList } from '@/components/b/theme/flow'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { similarThemes } from '@/lib/demo/theme-flow'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '이번에는 함께하지 못하게 됐어요' }

export default async function RejectedPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  return (
    <SimpleScreen title="내 여행" back="/trips">
      <StatusHead badge="거절" title="이번에는 함께하지 못하게 됐어요">
        호스트가 신청을 수락하지 않았어요. 사유는 따로 전달되지 않아요.
      </StatusHead>
      <ThemeMini t={t} className="mt-5" />
      <SectionHead title="비슷한 테마" />
      <ThemeList list={similarThemes(t)} />
    </SimpleScreen>
  )
}
