import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SubscribeButton } from '@/components/my/live-toggles'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { Mascot } from '@/components/ui/mascot'
import { Narrow, PageTitle } from '@/components/ui/parts'
import { ButtonLink, DemoNote } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { getViewer } from '@/lib/server/auth/session'
import { regionThemes } from '@/lib/server/queries/stamps'

export const metadata: Metadata = { title: '모집 중인 테마' }

type R = NonNullable<Awaited<ReturnType<typeof regionThemes>>>

function Found({ r }: { r: R }) {
  return (
    <>
      <PageTitle
        sub={
          r.hasStamp
            ? '아직 스탬프가 없는 장소예요. 이번 주말에 열린 테마가 있어요.'
            : '아직 스탬프가 없는 권역이에요. 이번 주말에 열린 테마가 있어요.'
        }
      >
        {r.region.name}에서
        <br />
        모집 중인 테마
      </PageTitle>
      <div className="mt-2.5">
        {r.list.map((t) => (
          <ThemeRow key={t.id} t={t} />
        ))}
      </div>
      <div className="mt-4 text-[12px] leading-[18px] text-muted">
        테마에 참여해 핵심 장소에서 체크인하면 그 장소의 스탬프를 받아요.
      </div>
    </>
  )
}

function Empty({ r, signedIn, here }: { r: R; signedIn: boolean; here: string }) {
  return (
    <>
      <div className="flex flex-col items-center pt-[72px] text-center">
        <Mascot size={72} tone="pale" face={false} />
        <div className="mt-5 text-[18px] font-bold">지금은 모집 중인 테마가 없어요</div>
        <div className="mt-1.5 text-[13px] leading-5 text-sub">
          {r.place ? `${r.place.name} · ${r.region.name}` : r.region.name}
          <br />
          호스트가 테마를 열면 알려드릴 수 있어요
        </div>
      </div>
      <div className="mt-7 flex flex-col gap-2">
        <ButtonLink href="/request" className="h-[52px]">
          이런 테마 요청하기
        </ButtonLink>
        {signedIn ? (
          <SubscribeButton kind="place" k={r.subKey} initial={r.subscribed} className="h-[52px]" />
        ) : (
          <ButtonLink
            href={`/login?next=${encodeURIComponent(here)}`}
            variant="outline"
            icon="bell"
            className="h-[52px]"
          >
            새 테마 알림 받기
          </ButtonLink>
        )}
      </div>
    </>
  )
}

export default async function StampRegionPage({
  params,
  searchParams,
}: {
  params: Promise<{ region: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const region = (await params).region
  const raw = (await searchParams).place
  const place = Array.isArray(raw) ? raw[0] : raw
  const v = await getViewer()
  const r = await regionThemes(db, region, place || undefined, v?.id)
  if (!r) notFound()
  const here = `/my/stamps/region/${region}${place ? `?place=${encodeURIComponent(place)}` : ''}`
  const title = r.list.length ? r.region.name : (r.place?.name ?? r.region.name)
  const body = r.list.length ? <Found r={r} /> : <Empty r={r} signedIn={!!v} here={here} />
  return (
    <>
      <MobileFrame>
        <BackBar title={title} back="/my/stamps" />
        <div className="px-5">{body}</div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        <Narrow eyebrow={title}>{body}</Narrow>
      </DesktopFrame>
    </>
  )
}
