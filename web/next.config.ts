import type { NextConfig } from 'next'

// 보안 헤더·요청 제한·TLS는 gate nginx(site-common.conf)가 맡는다. 여기서는 앱 쪽 기본값만.
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // standalone에 sharp를 넣지 않는다 — 이미지는 public/에 미리 줄여 둔다.
  images: { unoptimized: true },
  // 시작할 때 instrumentation.ts가 마이그레이션을 돌린다 → SQL 파일을 이미지에 같이 넣는다.
  outputFileTracingIncludes: { '/*': ['./drizzle/**/*'] },
}

export default nextConfig
