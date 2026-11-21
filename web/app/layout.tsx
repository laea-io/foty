import type { Metadata, Viewport } from 'next'
import { DesktopFooter, DesktopHeader } from '@/components/shell/desktop-header'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'foty — 남양주가 여는 당일 테마 여행', template: '%s · foty' },
  description: '남양주의 가게·관광지·주민이 여는 당일 테마 여행에 신청만 하면 코스까지 준비돼 있어요.',
}

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <DesktopHeader />
        {children}
        <DesktopFooter />
      </body>
    </html>
  )
}
