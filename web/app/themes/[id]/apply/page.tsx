import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ApplySheet } from '@/components/theme/apply-sheet'
import { ThemeDetail } from '@/components/theme/detail'
import { loadThemeCtx } from '@/components/theme/load'
import { requireViewer } from '@/lib/server/auth/session'
import { hostCard } from '@/lib/server/queries/theme-screens'

export const metadata: Metadata = { title: '참여 신청' }

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** 참여 신청: 상세 위에 시트(모바일) · 가운데 창(데스크톱). ?party=2 = 친구와 함께 */
export default async function ApplyPage({ params, searchParams }: Props) {
  const id = (await params).id
  const me = await requireViewer(`/themes/${id}/apply`)
  const { theme: t, rel } = await loadThemeCtx(params)
  if (rel.role !== 'viewer' || t.status !== '모집 중' || rel.application?.status === '거절')
    redirect(`/themes/${id}`)
  // 만 19세 이상 확인을 안 했으면 먼저(foty는 성인만)
  if (!me.adult) redirect(`/onboarding/2?next=${encodeURIComponent(`/themes/${id}/apply`)}`)
  const party = (await searchParams).party === '2' ? 2 : 1
  const host = await hostCard(t.hostId, t.intro)
  return (
    <>
      <ThemeDetail t={t} host={host} />
      <ApplySheet t={t} party={party} manual={t.confirmMode === 'manual'} />
    </>
  )
}
