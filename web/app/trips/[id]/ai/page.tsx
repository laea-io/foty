import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AiInput, type AiPlace, AiThread } from '@/components/b/trips/ai'
import { loadSpace } from '@/components/b/trips/load'
import { CloseLink, MobileSheet } from '@/components/b/trips/sheet'
import {
  SpaceDesktopHead,
  SpaceMobileHead,
  SpacePlanDesktop,
  SpacePlanMobile,
} from '@/components/b/trips/space'
import { DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote } from '@/components/ui/primitives'
import { aiSuggest } from '@/lib/server/q/b-trips'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = { title: 'AI 도우미' }

/** 받침이 있으면 '은', 없으면 '는' */
const eun = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00
  return c >= 0 && c <= 11171 && c % 28 ? '은' : '는'
}
const kindOf = (ask: string) =>
  ask.includes('카페') || ask.includes('차')
    ? '카페'
    : ask.includes('점심') || ask.includes('밥') || ask.includes('식사')
      ? '식당'
      : ask.includes('실내')
        ? '실내 장소'
        : ask.includes('예산') || ask.includes('싸')
          ? '부담 적은 곳'
          : '덜 걷는 곳'
const stayOf = (group: string) => (group === '카페' ? 50 : group === '맛집' ? 70 : 60)

/** AI 도우미 — 모바일은 공간 위 바텀시트, 데스크톱은 약도 자리에 패널. 검토된 장소에서만 찾는다 */
export default async function AiPage({ params, searchParams }: Props) {
  const sp = await loadSpace(params, '/ai')
  const t = sp.t
  const raw = (await searchParams).ask
  const ask = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) || undefined
  let places: AiPlace[] = []
  let heading: string | undefined
  let note = `검토된 장소 목록에서만 찾아요. 핵심 장소 ${t.place}${eun(t.place)} 바뀌지 않아요.`
  if (ask) {
    const r = await aiSuggest(sp, ask)
    if (!r.understood || !r.places.length) redirect(`/trips/${t.id}/ai/unknown?q=${encodeURIComponent(ask)}`)
    places = r.places.map((p) => ({
      id: p.id,
      name: p.name,
      meta: `${stayOf(p.group)}분 · ${p.cost ? `약 ${p.cost.toLocaleString('ko-KR')}원` : '무료'}`,
      image: { src: p.image, alt: p.imageAlt, bg: p.imageBg },
    }))
    heading = `코스 근처 ${kindOf(ask)} ${places.length}곳이에요`
    note = `${r.checkedOn ? `${r.checkedOn} 확인한 정보예요. ` : ''}핵심 장소 ${t.place}${eun(t.place)} 바뀌지 않아요. 제안은 호스트가 확인하면 일정에 반영돼요.`
  }
  const back = `/trips/${t.id}`
  const thread = (wide?: boolean) => (
    <AiThread id={t.id} ask={ask} places={places} heading={heading} note={note} wide={wide} />
  )
  return (
    <>
      <MobileFrame>
        <SpaceMobileHead sp={sp} tab="plan" />
        <SpacePlanMobile sp={sp} />
        <DemoNote />
        <div className="h-8" />
        <MobileSheet title="AI 도우미" closeHref={back} footer={<AiInput id={t.id} />}>
          {thread()}
        </MobileSheet>
      </MobileFrame>
      <DesktopFrame>
        <SpaceDesktopHead sp={sp} tab="plan" />
        <SpacePlanDesktop
          sp={sp}
          right={
            <section
              aria-label="AI 도우미"
              className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.03em]">AI 도우미</h2>
                <span className="-mr-3">
                  <CloseLink href={back} />
                </span>
              </div>
              {thread(true)}
              <div className="mt-[22px]">
                <AiInput id={t.id} wide />
              </div>
            </section>
          }
        />
      </DesktopFrame>
    </>
  )
}
