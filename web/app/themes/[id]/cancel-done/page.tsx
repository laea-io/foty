import type { Metadata } from 'next'
import { ResultHead, SectionHead, ThemeList } from '@/components/b/theme/flow'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { ButtonLink } from '@/components/ui/primitives'
import { similarThemes } from '@/lib/demo/theme-flow'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '신청을 취소했어요' }

export default async function CancelDonePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  return (
    <SimpleScreen
      title="내 여행"
      back="/trips"
      bottom={
        <div className="grow">
          <ButtonLink href="/trips" size="lg" block>
            내 여행으로
          </ButtonLink>
        </div>
      }
    >
      <ResultHead title="신청을 취소했어요" tone="pale">
        성사 전이라 다른 참여자에게 영향이 없어요.
      </ResultHead>
      <ThemeMini t={t} />
      <SectionHead title="비슷한 테마" />
      <ThemeList list={similarThemes(t)} />
    </SimpleScreen>
  )
}
