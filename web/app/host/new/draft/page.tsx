import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PublishButton, PublishForm } from '@/components/host/publish-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { MapSketch, StopList } from '@/components/theme/parts'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireHost } from '@/lib/server/auth'
import { draftCourse } from '@/lib/server/suggest'
import { dayLabel, parts } from '@/lib/server/time'

export const metadata: Metadata = { title: '코스 초안' }

type SP = {
  place?: string
  day?: string
  start?: string
  min?: string
  max?: string
  intro?: string
  cost?: string
  request?: string
  ask?: string
}
const ASKS = ['덜 걷는 코스로', '카페 한 곳 더', '실내 장소로']

export default async function HostDraftPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireHost('/host/new')
  const sp = await searchParams
  if (!sp.place || !sp.day || !sp.start) redirect('/host/new')
  const draft = await draftCourse(db, { corePlaceId: sp.place, start: sp.start, ask: sp.ask })
  if (!draft.length) redirect('/host/new')
  const core = draft.find((d) => d.fixed)?.place
  const back = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => k !== 'ask' && v) as [string, string][],
  )
  const stops = draft.map((d) => ({
    name: d.place.name,
    time: d.time,
    stay: `${d.stayMin}분`,
    kind: d.place.kind,
    checked: d.place.checkedOn ? `${parts(d.place.checkedOn).m}월 ${parts(d.place.checkedOn).d}일` : null,
    next: d.next ?? undefined,
    fixed: d.fixed,
    image: { src: d.place.image, alt: d.place.imageAlt, bg: d.place.imageBg },
  }))
  const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3))
  const last = draft[draft.length - 1]
  const hours = Math.round((toMin(last.time) + last.stayMin - toMin(draft[0].time)) / 60)
  const unchecked = draft.filter((d) => !d.place.checkedOn).map((d) => d.place.name)
  const fields = {
    place: sp.place,
    day: sp.day,
    start: sp.start,
    min: sp.min ?? '3',
    max: sp.max ?? '6',
    intro: sp.intro ?? '',
    cost: sp.cost ?? '',
    request: sp.request ?? '',
    title: core ? `${core.short ?? core.name}에서 보내는 하루` : '',
    stops: JSON.stringify(
      draft.map((d) => ({ placeId: d.placeId, time: d.time, stayMin: d.stayMin, next: d.next })),
    ),
  }
  const facts = (wide?: boolean) => (
    <div className="mt-4 flex border-y border-line py-3.5">
      {[
        ['날짜', dayLabel(sp.day as string)],
        ['총 시간', `${hours}시간`],
        ['인원', `${fields.min}~${fields.max}명`],
        ['이동', '대중교통'],
      ].map(([k, v]) => (
        <div key={k} className="flex-1">
          <div className={`text-muted ${wide ? 'text-[12px]' : 'text-[11px]'}`}>{k}</div>
          <div className={`mt-0.5 font-bold ${wide ? 'text-[15px]' : 'text-[14px]'}`}>{v}</div>
        </div>
      ))}
    </div>
  )
  const tools = (
    <div className="flex flex-wrap gap-1.5">
      {ASKS.map((a) => (
        <Link
          key={a}
          href={`/host/new/draft?${back}${sp.ask === a ? '' : `&ask=${encodeURIComponent(a)}`}`}
          aria-current={sp.ask === a ? 'true' : undefined}
          className={`inline-flex h-11 items-center rounded-full px-4 text-[15px] no-underline ${
            sp.ask === a ? 'bg-ink font-semibold text-white' : 'bg-face font-medium text-label'
          }`}
        >
          {a}
        </Link>
      ))}
    </div>
  )
  const note = (
    <Note className="mt-3">
      핵심 장소의 시간과 위치는 고정돼요.
      {unchecked.length > 0 &&
        ` ${unchecked.join(', ')}의 운영 정보는 확인되지 않았어요. 게시 전에 한 번 확인해 주세요.`}
    </Note>
  )
  const lead = (
    <div className="mt-1.5 text-[13px] leading-5 text-sub">초안이에요. 고치거나 그대로 게시할 수 있어요.</div>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="코스 초안" back={`/host/new?${back}`} />
        <div className="px-5">
          <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
            {core?.name} 앞뒤로
            <br />
            이런 코스를 붙였어요
          </h1>
          {lead}
          {facts()}
          <StopList stops={stops} className="mt-1" />
          <div className="mt-2">{tools}</div>
          {note}
          <PublishForm id="pub-m" fields={fields} />
          <DemoNote />
        </div>
        <BottomBar>
          <ButtonLink href={`/host/new?${back}`} variant="outline" size="lg">
            다시 만들기
          </ButtonLink>
          <div className="grow">
            <PublishButton form="pub-m" />
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
          {core?.name} 앞뒤로 이런 코스를 붙였어요
        </h1>
        {lead}
        <div className="mt-7 flex items-start gap-10">
          <div className="w-[480px] flex-none">
            {facts(true)}
            <StopList stops={stops} className="mt-1" />
            <div className="mt-2">{tools}</div>
            {note}
            <PublishForm id="pub-d" fields={fields} />
            <div className="mt-6 flex gap-2">
              <ButtonLink href={`/host/new?${back}`} variant="outline" size="lg">
                다시 만들기
              </ButtonLink>
              <div className="grow">
                <PublishButton form="pub-d" />
              </div>
            </div>
          </div>
          <div className="sticky top-6 min-w-0 flex-1">
            <MapSketch count={stops.length} height={600} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
