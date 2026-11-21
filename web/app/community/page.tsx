import type { Metadata } from 'next'
import { CommunityView } from '@/components/community/community-view'
import { posts } from '@/lib/demo/community'

export const metadata: Metadata = { title: '커뮤니티' }

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind ?? '전체'
  const list = kind === '전체' ? posts : posts.filter((p) => p.kind === kind)
  return <CommunityView list={list} kind={kind} />
}
