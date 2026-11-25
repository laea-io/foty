import type { Metadata } from 'next'
import { ThemeMini } from '@/components/theme/cards'
import { ResultHead } from '@/components/theme/flow'
import { JoinButton } from '@/components/theme/invite'
import { loadThemeCtx } from '@/components/theme/load'
import { SimpleScreen } from '@/components/trips/simple'
import { ButtonLink, Note, Progress } from '@/components/ui/primitives'
import { inviteFor } from '@/lib/server/queries/theme-screens'

export const metadata: Metadata = { title: '초대' }

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** 초대 링크(/themes/[id]/join?a=<신청 id>&s=<서명>) — 친구가 열어서 본인 신청(1명)을 한다 */
export default async function JoinPage({ params, searchParams }: Props) {
  const { theme: t, viewer, rel } = await loadThemeCtx(params)
  const sp = await searchParams
  const a = one(sp.a)
  const sig = one(sp.s)
  const inv = await inviteFor(t.id, a, sig)
  const here = `/themes/${t.id}/join?a=${a ?? ''}&s=${encodeURIComponent(sig ?? '')}`
  const mine = !!viewer && inv?.a.userId === viewer.id
  const already = rel.role === 'applicant' || rel.role === 'member' || rel.role === 'host'

  const primary = !inv ? (
    <ButtonLink href={`/themes/${t.id}`} size="lg" block>
      테마 보기
    </ButtonLink>
  ) : mine ? (
    <ButtonLink href={`/themes/${t.id}/invite`} size="lg" block>
      초대 화면으로
    </ButtonLink>
  ) : already ? (
    <ButtonLink href={`/themes/${t.id}`} size="lg" block>
      내 신청 보기
    </ButtonLink>
  ) : !viewer ? (
    <ButtonLink href={`/login?next=${encodeURIComponent(here)}`} variant="accent" size="lg" block>
      함께 신청하기
    </ButtonLink>
  ) : (
    <JoinButton themeId={t.id} a={inv.a.id} s={sig ?? ''} />
  )

  return (
    <SimpleScreen
      title="초대"
      back="/"
      bottom={
        <>
          <ButtonLink href={`/themes/${t.id}`} variant="outline" size="lg">
            테마 자세히 보기
          </ButtonLink>
          <div className="grow">{primary}</div>
        </>
      }
    >
      {inv ? (
        <ResultHead title={mine ? '내가 보낸 초대 링크예요' : `${inv.name} 님이 함께 가자고 했어요`}>
          아래 테마에 같이 신청하면 두 분이 한 묶음으로 들어가요.
        </ResultHead>
      ) : (
        <ResultHead title="초대 링크가 맞지 않아요" tone="pale">
          링크가 바뀌었거나 초대한 신청이 취소됐어요. 테마는 그대로 볼 수 있어요.
        </ResultHead>
      )}
      <ThemeMini t={t} />
      <div className="mt-4">
        <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <Note className="mt-4">
        신청하려면 가입과 성인 확인이 필요해요. 성사 전에는 언제든 취소할 수 있어요.
      </Note>
    </SimpleScreen>
  )
}
