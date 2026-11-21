import type { Metadata } from 'next'
import { ResultHead } from '@/components/b/theme/flow'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { ButtonLink, Note, Progress } from '@/components/ui/primitives'
import { me } from '@/lib/demo/people'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '초대' }

export default async function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  return (
    <SimpleScreen
      title="초대"
      back="/"
      bottom={
        <>
          <ButtonLink href={`/themes/${t.id}?view=guest`} variant="outline" size="lg">
            테마 자세히 보기
          </ButtonLink>
          <div className="grow">
            <ButtonLink href={`/login?next=/themes/${t.id}/apply`} variant="accent" size="lg" block>
              함께 신청하기
            </ButtonLink>
          </div>
        </>
      }
    >
      <ResultHead title={`${me.name} 님이 함께 가자고 했어요`}>
        아래 테마에 같이 신청하면 두 분이 한 묶음으로 들어가요.
      </ResultHead>
      <ThemeMini t={t} />
      <div className="mt-4">
        <Progress current={Math.min(t.current + 1, t.max)} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <Note className="mt-4">
        신청하려면 가입과 성인 확인이 필요해요. 성사 전에는 언제든 취소할 수 있어요.
      </Note>
    </SimpleScreen>
  )
}
