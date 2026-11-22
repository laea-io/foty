import type { Metadata } from 'next'
import { loadSpace } from '@/components/b/trips/load'
import { ProposeForm } from '@/components/b/trips/propose-form'
import { PageTitle, SimpleScreen } from '@/components/b/trips/simple'

export const metadata: Metadata = { title: '변경 제안' }

/** 그룹 공간 · 날짜/집결/예산 바꾸자고 제안하기 */
export default async function ProposePage({ params }: { params: Promise<{ id: string }> }) {
  const sp = await loadSpace(params, '/propose')
  const t = sp.t
  return (
    <SimpleScreen title="변경 제안" back={`/trips/${t.id}`}>
      <PageTitle sub="코스 안의 장소를 바꾸려면 AI 도우미에서 대안을 골라 제안해요.">
        일정을 바꾸자고 제안해요
      </PageTitle>
      <ProposeForm themeId={t.id} day={t.day} cost={t.cost} meet={t.meetDetail ?? ''} />
    </SimpleScreen>
  )
}
