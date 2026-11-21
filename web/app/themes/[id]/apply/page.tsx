import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ApplySheet } from '@/components/b/theme/apply-sheet'
import { loadThemeCtx } from '@/components/b/theme/load'
import { ThemeDetail } from '@/components/theme/detail'
import { requireViewer } from '@/lib/server/auth'
import { hostCard } from '@/lib/server/q/b-themes'

export const metadata: Metadata = { title: '참여 신청' }

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** 참여 신청: 상세 위에 시트(모바일) · 가운데 창(데스크톱). ?party=2 = 친구와 함께 */
export default async function ApplyPage({ params, searchParams }: Props) {
  const id = (await params).id
  await requireViewer(`/themes/${id}/apply`)
  const { theme: t, rel } = await loadThemeCtx(params)
  if (rel.role !== 'viewer' || t.status !== '모집 중') redirect(`/themes/${id}`)
  const party = (await searchParams).party === '2' ? 2 : 1
  const host = await hostCard(t.hostId, t.intro)
  return (
    <>
      <ThemeDetail t={t} host={host} />
      <ApplySheet t={t} party={party} manual={t.confirmMode === 'manual'} />
    </>
  )
}
