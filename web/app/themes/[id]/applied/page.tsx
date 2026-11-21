import type { Metadata } from 'next'
import { ResultHead } from '@/components/b/theme/flow'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { ShareAction } from '@/components/b/trips/actions'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { ButtonLink, Note, Progress } from '@/components/ui/primitives'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '신청을 보냈어요' }

export default async function AppliedPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  const current = Math.min(t.current + 1, t.max)
  return (
    <SimpleScreen
      title="참여 신청"
      back={`/themes/${t.id}`}
      bottom={
        <>
          <ShareAction
            label="친구에게 공유"
            title={t.title}
            path={`/themes/${t.id}/join`}
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
      <ResultHead title="신청을 보냈어요">
        호스트가 확인하면 알려드려요.
        <br />
        성사 전에는 언제든 취소할 수 있어요.
      </ResultHead>
      <ThemeMini t={t} />
      <div className="mt-5">
        <Progress current={current} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <Note className="mt-4">
        내 신청이 수락되면 최소 인원이 채워져 성사돼요. 친구에게 공유하면 더 빨리 채워져요.
      </Note>
    </SimpleScreen>
  )
}
