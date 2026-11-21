import type { Metadata } from 'next'
import { ApplySheet } from '@/components/b/theme/apply-sheet'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { ThemeDetail } from '@/components/theme/detail'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '참여 신청' }

/** 참여 신청: 상세 위에 시트(모바일) · 가운데 창(데스크톱) */
export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  return (
    <>
      <ThemeDetail t={t} />
      <ApplySheet t={t} />
    </>
  )
}
