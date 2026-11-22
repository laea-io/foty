import { and, eq, isNull, sql } from 'drizzle-orm'
import type { Metadata, Viewport } from 'next'
import { KakaoKeyProvider } from '@/components/map/kakao-map'
import { DesktopFooter, DesktopHeader } from '@/components/shell/desktop-header'
import { type ViewerBrief, ViewerProvider } from '@/components/shell/viewer-context'
import { db, schema } from '@/lib/db'
import { env } from '@/lib/env'
import { getViewer } from '@/lib/server/auth'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'foty — 남양주가 여는 당일 테마 여행', template: '%s · foty' },
  description: '남양주의 가게·관광지·주민이 여는 당일 테마 여행에 신청만 하면 코스까지 준비돼 있어요.',
}

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 }

async function viewerBrief(): Promise<ViewerBrief> {
  const v = await getViewer()
  if (!v) return null
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, v.id), isNull(schema.notifications.readAt)))
  return { name: v.name, unread: Number(n) }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brief = await viewerBrief()
  return (
    <html lang="ko">
      <head>
        <link
          rel="preload"
          href="/fonts/WantedSansVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
      </head>
      <body>
        <ViewerProvider value={brief}>
          <KakaoKeyProvider value={env.KAKAO_JS_KEY}>
            <DesktopHeader />
            {children}
            <DesktopFooter />
          </KakaoKeyProvider>
        </ViewerProvider>
      </body>
    </html>
  )
}
