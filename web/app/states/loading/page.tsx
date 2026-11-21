import type { Metadata } from 'next'
import { LoadingSkeleton } from '@/components/a/states'

export const metadata: Metadata = { title: '불러오는 중' }

/** 시연: 불러오는 중 화면(app/loading.tsx와 같은 뼈대) */
export default function LoadingDemoPage() {
  return <LoadingSkeleton />
}
