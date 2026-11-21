import type { Metadata } from 'next'
import { RequestForm } from '@/components/b/theme/request-form'

export const metadata: Metadata = { title: '테마 요청' }

export default function RequestPage() {
  return <RequestForm />
}
