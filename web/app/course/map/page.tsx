import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CourseView } from '@/components/course/course-view'
import { courseFor } from '@/lib/server/queries/places'

export const metadata: Metadata = { title: '코스 지도' }

export default async function CourseMapPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; ask?: string }>
}) {
  const sp = await searchParams
  const c = await courseFor(sp.place, sp.ask)
  if (!c) notFound()
  return <CourseView c={c} view="map" />
}
