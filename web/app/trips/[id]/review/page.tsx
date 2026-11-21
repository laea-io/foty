import type { Metadata } from 'next'
import { loadSpace, spaceParams } from '@/components/b/trips/load'
import { ReviewForm } from '@/components/b/trips/review'
import { PageTitle, SimpleScreen } from '@/components/b/trips/simple'
import { ButtonLink } from '@/components/ui/primitives'

type Props = { params: Promise<{ id: string }> }

export const generateStaticParams = spaceParams
export const metadata: Metadata = { title: '평가' }

export default async function ReviewPage({ params }: Props) {
  const { t } = loadSpace((await params).id)
  return (
    <SimpleScreen
      title="평가"
      back="/trips/past"
      bottom={
        <>
          <ButtonLink href={`/report?theme=${t.id}`} variant="outline" size="lg">
            신고하기
          </ButtonLink>
          <div className="grow">
            <ButtonLink href="/trips/past" size="lg" block>
              평가 보내기
            </ButtonLink>
          </div>
        </>
      }
    >
      <PageTitle sub="해당하는 것만 골라 주세요. 고르지 않아도 괜찮아요.">
        함께한 사람들은 어땠나요?
      </PageTitle>
      <ReviewForm />
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        평가는 서로 제출했거나 평가 기간이 끝난 뒤에 반영돼요. 불편했던 일은 평가 대신 신고로 알려주세요.
        신고는 공개되지 않아요.
      </div>
    </SimpleScreen>
  )
}
