import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Narrow } from '@/components/a/form'
import { BlockButton } from '@/components/a/live-toggles'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Avatar, ButtonLink, DemoNote } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireViewer } from '@/lib/server/auth'
import { userProfile } from '@/lib/server/q/a'

export const metadata: Metadata = { title: '참여자' }

type Profile = Extract<NonNullable<Awaited<ReturnType<typeof userProfile>>>, { allowed: true }>

const chip = 'inline-flex h-11 items-center rounded-full px-4 text-[15px] font-medium text-label'

function Body({ p }: { p: Profile }) {
  return (
    <>
      <div className="flex flex-col items-center pt-4 text-center">
        <Avatar name={p.name} size={88} />
        <div className="mt-3 text-[22px] font-extrabold tracking-[-0.04em]">{p.name}</div>
        {p.origin && <div className="mt-1 text-[13px] text-sub">{p.origin} 출발</div>}
      </div>
      {p.showTrips && (
        <>
          <div className="mt-[26px] mb-2.5 text-[14px] font-semibold">동행 기록</div>
          <div className="rounded-[16px] bg-face px-[18px] py-4">
            <div className="text-[18px] font-extrabold">
              {p.trips ? `동행 ${p.trips}회` : '첫 동행이에요'}
            </div>
            {p.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {p.tags.map(([t, n]) => (
                  <span key={t} className={`${chip} bg-white`}>
                    {t} {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {p.taste.length > 0 && (
        <>
          <div className="mt-[26px] mb-2.5 text-[14px] font-semibold">여행 성향</div>
          <div className="flex flex-wrap gap-1.5">
            {p.taste.map((t) => (
              <span key={t} className={`${chip} bg-face`}>
                {t}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        프로필은 성사된 테마의 참여자에게만 보여요. MBTI는 본인이 공개한 경우에만 보여요.
      </div>
    </>
  )
}

function Buttons({ p }: { p: Profile }) {
  if (p.self)
    return (
      <div className="grow">
        <ButtonLink href="/my" variant="outline" size="lg" block>
          마이로 가기
        </ButtonLink>
      </div>
    )
  return (
    <>
      <BlockButton userId={p.id} initial={p.blocked} off="차단" on="차단 해제" size="lg" />
      <div className="grow">
        <ButtonLink href={`/report?user=${p.handle}`} variant="outline" size="lg" icon="flag" block>
          신고
        </ButtonLink>
      </div>
    </>
  )
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  const viewer = await requireViewer(`/users/${id}`)
  const p = await userProfile(db, id, viewer)
  // 성사된 테마를 함께하지 않은 사람의 프로필은 없는 것처럼(공개 범위 — 기획안 9장)
  if (!p?.allowed) notFound()
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="참여자" back={p.back} />
        <div className="px-5">
          <Body p={p} />
        </div>
        <DemoNote />
        <BottomBar>
          <Buttons p={p} />
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow="참여자">
          <Body p={p} />
          <div className="mt-8 flex gap-2.5">
            <Buttons p={p} />
          </div>
        </Narrow>
      </DesktopFrame>
    </>
  )
}
