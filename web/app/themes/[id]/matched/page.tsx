import type { Metadata } from 'next'
import { ResultHead } from '@/components/b/theme/flow'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { ShareAction } from '@/components/b/trips/actions'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { AvatarStack, ButtonLink } from '@/components/ui/primitives'
import { matchedPeople, meetFor } from '@/lib/demo/theme-flow'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '테마가 성사됐어요' }

export default async function MatchedPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  const p = matchedPeople(t)
  return (
    <SimpleScreen
      title="내 여행"
      back="/trips"
      bottom={
        <>
          <ShareAction label="가족에게 일정 공유" title={t.title} variant="outline" size="lg" />
          <div className="grow">
            <ButtonLink href={`/trips/${t.id}`} size="lg" block>
              그룹 공간 열기
            </ButtonLink>
          </div>
        </>
      }
    >
      <ResultHead title="테마가 성사됐어요">
        최소 인원이 모였어요. 이제 그룹 공간에서
        <br />
        집결과 코스를 함께 정해요.
      </ResultHead>
      <ThemeMini t={t} />
      <div className="mt-4 rounded-[16px] p-[18px] shadow-[inset_0_0_0_1px_var(--color-line)]">
        <div className="text-[12px] text-sub">집결 · 성사되어 공개됐어요</div>
        <div className="mt-1 text-[20px] font-extrabold tracking-[-0.03em]">{meetFor(t)}</div>
        <div className="mt-3.5 flex items-center gap-2">
          <AvatarStack names={p.names} size={36} />
          <span className="text-[12px] text-sub">
            호스트 {p.host} · 참여자 {p.guests}명
          </span>
        </div>
      </div>
    </SimpleScreen>
  )
}
