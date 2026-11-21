import type { Metadata } from 'next'
import { CourseView } from '@/components/course/course-view'
import { courseFor } from '@/lib/demo/courses'

export const metadata: Metadata = { title: '코스' }

export default async function CoursePage({ searchParams }: { searchParams: Promise<{ place?: string }> }) {
  return <CourseView c={courseFor((await searchParams).place)} view="list" />
}
