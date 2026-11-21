import type { Metadata } from 'next'
import { SectionHead } from '@/components/b/theme/flow'
import { CopyLink, KakaoShare } from '@/components/b/theme/invite'
import { loadTheme, themeParams } from '@/components/b/theme/load'
import { SimpleScreen } from '@/components/b/trips/simple'
import { ThemeMini } from '@/components/theme/cards'
import { Avatar, Badge, ButtonLink, Note } from '@/components/ui/primitives'
import { me } from '@/lib/demo/people'
import { inviteDeadline, inviteLink } from '@/lib/demo/theme-flow'

export const generateStaticParams = themeParams
export const metadata: Metadata = { title: '친구와 함께' }

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await loadTheme(params)
  const link = inviteLink(t)
  const rows = [
    { name: `${me.name} (나)`, avatar: me.name, state: '신청 대기', badge: <Badge tone="ink">신청함</Badge> },
    {
      name: '친구',
      avatar: '친구',
      state: '링크를 아직 열지 않았어요',
      badge: <Badge tone="muted">대기</Badge>,
    },
  ]
  return (
    <SimpleScreen
      title="친구와 함께"
      back={`/themes/${t.id}/apply`}
      bottom={
        <>
          <KakaoShare title={t.title} link={link} />
          <ButtonLink href={`/themes/${t.id}/applied`} variant="outline" size="lg">
            혼자 신청으로 바꾸기
          </ButtonLink>
        </>
      }
    >
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        친구에게 링크를 보내 주세요
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        친구가 링크에서 신청하면 두 분이 함께 신청한 것으로 묶여요.
      </div>
      <ThemeMini t={t} className="mt-[18px]" />
      <CopyLink link={link} />
      <SectionHead title="함께 신청" aside={<span className="text-[12px] text-sub">친구는 1명까지</span>} />
      {rows.map((r) => (
        <div key={r.name} className="flex gap-3 border-t border-line py-4">
          <Avatar name={r.avatar} size={44} />
          <div className="min-w-0 grow">
            <div className="text-[15px] font-bold">{r.name}</div>
            <div className="mt-0.5 text-[12px] text-sub">{r.state}</div>
          </div>
          {r.badge}
        </div>
      ))}
      <Note className="mt-4">
        친구가 {inviteDeadline(t)}까지 신청하지 않으면 혼자 신청한 것으로 바뀌어요. 친구도 성인 확인과 가입이
        필요해요.
      </Note>
    </SimpleScreen>
  )
}
