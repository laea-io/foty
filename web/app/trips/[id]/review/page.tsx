import type { Metadata } from 'next'
import { loadSpace } from '@/components/b/trips/load'
import { ReviewForm } from '@/components/b/trips/review'
import { PageTitle, SimpleScreen } from '@/components/b/trips/simple'
import { ButtonLink } from '@/components/ui/primitives'
import { requireViewer } from '@/lib/server/auth'
import { reviewData } from '@/lib/server/q/b-trips'
import { parts } from '@/lib/server/time'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: '평가' }

/** 평가 — 여행 완료 뒤, 함께 다녀온(체크인한) 사람에게 행동 태그만 */
export default async function ReviewPage({ params }: Props) {
  const sp = await loadSpace(params, '/review')
  const viewer = await requireViewer(`/trips/${sp.t.id}/review`)
  const t = sp.t
  const r = await reviewData(t.id, viewer.id)
  const p = parts(r.deadline)
  const blocked =
    r.status !== '여행 완료'
      ? '여행이 끝나면 함께한 사람들을 평가할 수 있어요.'
      : !r.allowed
        ? '체크인 기록이 있는 참여자만 평가할 수 있어요. 참여 확인이 끝나면 다시 열어 주세요.'
        : r.late
          ? '평가 기간이 끝났어요.'
          : !r.people.length
            ? '평가할 사람이 없어요.'
            : null
  return (
    <SimpleScreen title="평가" back="/trips/past">
      <PageTitle sub="해당하는 것만 골라 주세요. 고르지 않아도 괜찮아요.">
        함께한 사람들은 어땠나요?
      </PageTitle>
      {blocked ? (
        <>
          <div className="mt-[18px] rounded-[14px] bg-face px-4 py-3.5 text-[14px] leading-[21px]">
            {blocked}
          </div>
          <div className="mt-6 flex gap-2.5">
            <ButtonLink href={`/trips/${t.id}`} size="lg" block>
              그룹 공간으로
            </ButtonLink>
          </div>
        </>
      ) : (
        <ReviewForm
          themeId={t.id}
          people={r.people}
          firstVisit={r.firstVisit}
          deadline={`${p.m}월 ${p.d}일`}
        />
      )}
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        평가는 서로 제출했거나 평가 기간이 끝난 뒤에 반영돼요. 불편했던 일은 평가 대신 신고로 알려주세요.
        신고는 공개되지 않아요.
      </div>
    </SimpleScreen>
  )
}
