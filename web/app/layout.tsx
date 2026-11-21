import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'newapp',
  description: 'newapp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
