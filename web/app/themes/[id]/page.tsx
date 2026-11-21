import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ThemeDetail } from '@/components/theme/detail'
import { themeById, themes } from '@/lib/demo/themes'

export function generateStaticParams() {
  return themes.map((t) => ({ id: t.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = themeById((await params).id)
  return { title: t?.title }
}

export default async function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const t = themeById((await params).id)
  if (!t) notFound()
  return <ThemeDetail t={t} />
}
