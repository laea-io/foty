import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Narrow, PageTitle } from '@/components/a/form'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { NotifyButton } from '@/components/theme/notify-button'
import { Mascot } from '@/components/ui/mascot'
import { ButtonLink, DemoNote } from '@/components/ui/primitives'
import { placeById, places, recruitingFor, regionById, regions } from '@/lib/demo/stamps'

export function generateStaticParams() {
  return [
    ...regions.map((r) => ({ region: r.id })),
    ...places.filter((p) => !p.visits).map((p) => ({ region: p.id })),
  ]
}

/** 주소의 값은 권역 id(이 권역의 다른 테마 보기) 또는 빈 칸 장소 id */
function resolve(key: string) {
  const place = placeById(key)
  const region = regionById(place ? place.region : key)
  if (!region) return null
  const ids = place
    ? (place.themeIds ?? [])
    : places.filter((p) => p.region === region.id).flatMap((p) => p.themeIds ?? [])
  const hasStamp = places.some((p) => p.region === region.id && p.visits)
  return { place, region, list: recruitingFor(ids), hasStamp }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>
}): Promise<Metadata> {
  const r = resolve((await params).region)
  return { title: r ? `${r.region.name} 모집 중인 테마` : '권역' }
}

function Found({ r }: { r: NonNullable<ReturnType<typeof resolve>> }) {
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

function Empty({ r }: { r: NonNullable<ReturnType<typeof resolve>> }) {
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
        <NotifyButton />
      </div>
    </>
  )
}

export default async function StampRegionPage({ params }: { params: Promise<{ region: string }> }) {
  const r = resolve((await params).region)
  if (!r) notFound()
  const title = r.list.length ? r.region.name : (r.place?.name ?? r.region.name)
  const body = r.list.length ? <Found r={r} /> : <Empty r={r} />
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
