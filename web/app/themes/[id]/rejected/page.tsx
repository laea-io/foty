import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SectionHead, StatusHead, ThemeList } from '@/components/b/theme/flow'
import { loadThemeCtx } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { requireViewer } from '@/lib/server/auth'
import { similarThemes } from '@/lib/server/q/b-themes'

export const metadata: Metadata = { title: '이번에는 함께하지 못하게 됐어요' }

export default async function RejectedPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer(`/themes/${(await params).id}/rejected`)
  const { theme: t, rel } = await loadThemeCtx(params)
  // 실제로 그 상태인 신청이 있을 때만(주소만 바꿔 들어오면 상세로)
  if (rel.application?.status !== '거절') redirect(`/themes/${t.id}`)
  return (
    <SimpleScreen title="내 여행" back="/trips">
      <StatusHead badge="거절" title="이번에는 함께하지 못하게 됐어요">
        호스트가 신청을 수락하지 않았어요. 사유는 따로 전달되지 않아요.
      </StatusHead>
      <ThemeMini t={t} className="mt-5" />
      <SectionHead title="비슷한 테마" />
      <ThemeList list={await similarThemes(t)} />
    </SimpleScreen>
  )
}
