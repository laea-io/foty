import type { Metadata } from 'next'
import { loadSpace } from '@/components/b/trips/load'
import { PageTitle, SimpleScreen } from '@/components/b/trips/simple'
import { Badge } from '@/components/ui/primitives'
import { changeHistory } from '@/lib/server/q/b-trips'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: '변경 이력' }

export default async function HistoryPage({ params }: Props) {
  const sp = await loadSpace(params, '/history')
  const t = sp.t
  const history = await changeHistory(sp)
  return (
    <SimpleScreen title="그룹 여행 공간" back={`/trips/${t.id}`}>
      <PageTitle sub="반영되지 않은 제안도 기록으로 남아요.">변경 이력</PageTitle>
      <div className="mt-[18px]">
        {!history.length && (
          <div className="border-t border-line py-[18px] text-[13px] text-sub">아직 변경 이력이 없어요.</div>
        )}
        {history.map((h) => (
          <div key={h.id} className="border-t border-line py-[18px]">
            <div className="flex items-center justify-between">
              <Badge tone={h.badge.tone}>{h.badge.label}</Badge>
              <span className="text-[12px] text-muted">{h.meta}</span>
            </div>
            <div className="mt-2.5 text-[15px] font-semibold">{h.what}</div>
            <div className="mt-1 flex items-baseline gap-2 text-[14px]">
              <span className="text-muted line-through">{h.from}</span>
              <span className="font-bold">{h.to}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        핵심 장소와 그 시간은 호스트만 바꿀 수 있어요. 날짜·집결·예산 변경은 모든 참여자의 확인이 필요해요.
      </div>
    </SimpleScreen>
  )
}
