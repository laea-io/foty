import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ResultHead } from '@/components/b/theme/flow'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ButtonLink } from '@/components/ui/primitives'
import { db, schema as s } from '@/lib/db'
import { env } from '@/lib/env'
import { act } from '@/lib/server/act'
import { requireViewer } from '@/lib/server/auth'
import { readCheckinToken } from '@/lib/server/checkin-token'
import { checkin } from '@/lib/server/domain/flow'

export const metadata: Metadata = { title: '현장 체크인' }

/**
 * 체크인 QR이 여는 주소(/c/<토큰>). 토큰 = 테마 id + 서명(그 테마 · 그 날짜에만 맞는다).
 * 로그인한 참여자면 바로 체크인하고 완료 화면으로. 시연(DEMO_MODE=1)에서는 아무 날짜에나.
 */
export default async function CheckinTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const token = decodeURIComponent((await params).token)
  const viewer = await requireViewer(`/c/${encodeURIComponent(token)}`)
  const i = token.lastIndexOf('.')
  const guess = i > 0 ? token.slice(0, i) : ''
  const [t] = guess
    ? await db.select({ id: s.themes.id, day: s.themes.day }).from(s.themes).where(eq(s.themes.id, guess))
    : []
  const themeId = t ? readCheckinToken(token, (id) => (id === t.id ? t.day : undefined)) : null
  if (!themeId) notFound()
  const r = await act(() => checkin(db, { themeId, userId: viewer.id, anyDay: env.DEMO_MODE === '1' }))
  if (r.ok) redirect(`/trips/${themeId}/checkin/done`)
  return (
    <SimpleScreen
      title="현장 체크인"
      back={`/trips/${themeId}`}
      bottom={
        <div className="grow">
          <ButtonLink href={`/trips/${themeId}/checkin`} size="lg" block>
            체크인 화면으로
          </ButtonLink>
        </div>
      }
    >
      <ResultHead title="체크인하지 못했어요" tone="pale">
        {r.error}
      </ResultHead>
    </SimpleScreen>
  )
}
