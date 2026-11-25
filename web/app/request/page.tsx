import type { Metadata } from 'next'
import { RequestForm } from '@/components/theme/request-form'
import { requireViewer } from '@/lib/server/auth/session'

export const metadata: Metadata = { title: '테마 요청' }

export default async function RequestPage() {
  await requireViewer('/request')
  return <RequestForm />
}
