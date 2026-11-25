import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ThemeMini } from '@/components/theme/cards'
import { SectionHead } from '@/components/theme/flow'
import { CopyLink, KakaoShare, SoloButton } from '@/components/theme/invite'
import { loadThemeCtx } from '@/components/theme/load'
import { SimpleScreen } from '@/components/trips/simple'
import { Avatar, Badge, Note } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { requireViewer } from '@/lib/server/auth/session'
import { inviteSig } from '@/lib/server/auth/tokens'
import { invitedFriend } from '@/lib/server/domain/trips'
import { inviteDeadline } from '@/lib/server/queries/theme-screens'

export const metadata: Metadata = { title: '친구와 함께' }

/** 친구와 함께 신청: 내 신청(2명)에 묶인 초대 링크. 친구가 링크에서 신청하면 친구 자리가 친구 신청으로 옮겨 간다 */
export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  const viewer = await requireViewer(`/themes/${id}/invite`)
  const { theme: t, rel } = await loadThemeCtx(params)
  const a = rel.application
  if (!a || (rel.role !== 'applicant' && rel.role !== 'member')) redirect(`/themes/${id}/apply?party=2`)
  const url = `${env.APP_URL}/themes/${t.id}/join?a=${a.id}&s=${inviteSig(a.id)}`
  const friend = await invitedFriend(db, a.id)
  const rows = [
    {
      key: 'me',
      name: `${viewer.name} (나)`,
      avatar: viewer.name,
      state: a.status,
      badge: <Badge tone="ink">신청함</Badge>,
    },
    friend
      ? {
          key: 'friend',
          name: friend.name,
          avatar: friend.name,
          state: friend.a.status,
          badge: <Badge tone="ink">신청함</Badge>,
        }
      : {
          key: 'friend',
          name: '친구',
          avatar: '친구',
          state: '아직 링크에서 신청하지 않았어요',
          badge: <Badge tone="muted">대기</Badge>,
        },
  ]
  return (
    <SimpleScreen
      title="친구와 함께"
      back={`/themes/${t.id}`}
      bottom={
        <>
          <KakaoShare title={t.title} url={url} />
          {!friend && a.party > 1 && <SoloButton themeId={t.id} />}
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
      <CopyLink url={url} />
      <SectionHead title="함께 신청" aside={<span className="text-[12px] text-sub">친구는 1명까지</span>} />
      {rows.map((r) => (
        <div key={r.key} className="flex gap-3 border-t border-line py-4">
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
