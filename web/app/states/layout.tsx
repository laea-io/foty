import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import type { ReactNode } from 'react'
import { env } from '@/lib/env'

// 시안·상태 확인용 화면은 스테이징 시연(DEMO_MODE=1)에서만 연다. 운영에서는 없는 주소처럼 보인다.
// connection(): 빌드 때 정적으로 굳지 않고 요청마다 환경변수를 본다.
export default async function DemoOnlyLayout({ children }: { children: ReactNode }) {
  await connection()
  if (env.DEMO_MODE !== '1') notFound()
  return children
}
