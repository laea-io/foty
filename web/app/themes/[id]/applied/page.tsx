import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ResultHead } from '@/components/b/theme/flow'
import { loadThemeCtx } from '@/components/b/theme/load'
import { ShareAction } from '@/components/b/trips/actions'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { ButtonLink, Note, Progress } from '@/components/ui/primitives'
import { requireViewer } from '@/lib/server/auth'

export const metadata: Metadata = { title: '신청을 보냈어요' }

export default async function AppliedPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  await requireViewer(`/themes/${id}/applied`)
  const { theme: t, rel } = await loadThemeCtx(params)
  const a = rel.application
  if (!a || (rel.role !== 'applicant' && rel.role !== 'member')) redirect(`/themes/${id}`)
  const waiting = a.status === '신청 대기'
  // 대기 중이면 “내 신청이 수락되면”의 인원을 보여 준다
  const current = waiting ? Math.min(t.current + a.party, t.max) : t.current
  return (
    <SimpleScreen
      title="참여 신청"
      back={`/themes/${t.id}`}
      bottom={
        <>
          <ShareAction
            label="친구에게 공유"
            title={t.title}
            path={a.party > 1 ? `/themes/${t.id}/invite` : `/themes/${t.id}`}
            variant="outline"
            size="lg"
          />
          <div className="grow">
            <ButtonLink href="/trips" size="lg" block>
              내 여행 보기
            </ButtonLink>
          </div>
        </>
      }
    >
      {waiting ? (
        <ResultHead title="신청을 보냈어요">
          호스트가 확인하면 알려드려요.
          <br />
          성사 전에는 언제든 취소할 수 있어요.
        </ResultHead>
      ) : (
        <ResultHead title="신청이 확정됐어요">
          최소 인원이 모이면 성사돼요.
          <br />
          성사 전에는 언제든 취소할 수 있어요.
        </ResultHead>
      )}
      <ThemeMini t={t} />
      <div className="mt-5">
        <Progress current={current} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <Note className="mt-4">
        {waiting
          ? '내 신청이 수락되면 최소 인원이 채워져 성사돼요. 친구에게 공유하면 더 빨리 채워져요.'
          : t.matched
            ? '최소 인원이 모였어요. 그룹 공간에서 집결과 일정을 함께 정해요.'
            : `성사까지 ${t.min - t.current}명 남았어요. 친구에게 공유하면 더 빨리 채워져요.`}
      </Note>
    </SimpleScreen>
  )
}
