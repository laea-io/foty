import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StateDetail } from '@/components/b/theme/state-detail'
import { ThemeDetail } from '@/components/theme/detail'
import { themeById, themes } from '@/lib/demo/themes'

export function generateStaticParams() {
  return themes.map((t) => ({ id: t.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = themeById((await params).id)
  return { title: t?.title }
}

/**
 * 테마 상세. 상태별 화면:
 * 모집 마감(테마 상태 그대로) · ?view=confirmed 일정 확정 · ?view=done 여행 완료 · ?view=guest 비로그인
 */
export default async function ThemePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const t = themeById((await params).id)
  if (!t) notFound()
  const view = (await searchParams).view
  if (view === 'confirmed' || view === 'done') return <StateDetail t={t} state={view} />
  if (t.status === '모집 마감' && view !== 'guest') return <StateDetail t={t} state="closed" />
  return <ThemeDetail t={t} guest={view === 'guest'} />
}
