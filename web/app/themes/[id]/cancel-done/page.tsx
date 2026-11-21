import type { Metadata } from 'next'
import { ResultHead, SectionHead, ThemeList } from '@/components/b/theme/flow'
import { loadThemeCtx } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { ButtonLink } from '@/components/ui/primitives'
import { requireViewer } from '@/lib/server/auth'
import { similarThemes } from '@/lib/server/q/b-themes'

export const metadata: Metadata = { title: '신청을 취소했어요' }

/** 신청 취소 완료(취소는 cancelAction이 하고 여기로 온다) */
export default async function CancelDonePage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer(`/themes/${(await params).id}/cancel-done`)
  const { theme: t } = await loadThemeCtx(params)
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
      <ThemeList list={await similarThemes(t)} />
    </SimpleScreen>
  )
}
