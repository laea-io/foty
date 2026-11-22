import type { MetadataRoute } from 'next'

// 로그인한 뒤에만 쓰는 서비스라 첫 화면(로그인)만 검색에 연다
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/login', disallow: '/' } }
}
