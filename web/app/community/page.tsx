import type { Metadata } from 'next'
import { CommunityView } from '@/components/community/community-view'
import { openThemes, posts } from '@/lib/server/q/c'

export const metadata: Metadata = { title: '커뮤니티' }

const KINDS = ['여행 후기', '코스 공유', '질문']

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string }>
}) {
  const sp = await searchParams
  const k = sp.kind
  const kind = k && KINDS.includes(k) ? k : '전체'
  const q = (typeof sp.q === 'string' ? sp.q : '').trim().slice(0, 60)
  const [list, open] = await Promise.all([posts(kind === '전체' ? undefined : kind, q), openThemes()])
  return <CommunityView list={list} kind={kind} open={open} q={q} />
}
