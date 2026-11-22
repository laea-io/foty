import type { Metadata } from 'next'
import Link from 'next/link'
import { NewThemeForm } from '@/components/host/new-theme-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeTile } from '@/components/theme/cards'
import { Button, DemoNote, Note } from '@/components/ui/primitives'
import { requireHost } from '@/lib/server/auth'
import { corePlaces, hostThemes } from '@/lib/server/q/c'
import { weekStrip } from '@/lib/server/q/themes'
import { addDays, kst } from '@/lib/server/time'

export const metadata: Metadata = { title: '테마 등록' }

type SP = {
  place?: string
  day?: string
  start?: string
  min?: string
  max?: string
  intro?: string
  cost?: string
  request?: string
}

export default async function HostNewPage({ searchParams }: { searchParams: Promise<SP> }) {
  const v = await requireHost('/host/new')
  const sp = await searchParams
  const places = await corePlaces()
  // 가게·관광지 호스트는 자기 가게가 기본, 주민은 아무 곳이나
  const own = places.find((p) => p.name === v.host.name)
  const list = (own ? [own, ...places.filter((p) => p !== own)] : places).map((p) => ({
    id: p.id,
    label: `${p.name} · ${p.area} · ${p.kind}`,
    group: p.group,
  }))
  // 마감(전날 18:00)이 지난 날은 고를 수 없다
  const now = new Date()
  const days = weekStrip(now).map((d) => ({
    ...d,
    disabled: kst(addDays(d.iso, -1), '18:00') <= now,
  }))
  const more = weekStrip(new Date(now.getTime() + 7 * 86400000)).map((d) => ({ ...d, disabled: false }))
  const strip = [...days.filter((d) => !d.disabled), ...more].slice(0, 7)
  const maxDay = addDays(strip[0]?.iso ?? days[0].iso, 60)
  const defaults = {
    place: sp.place ?? own?.id ?? places[0]?.id ?? '',
    day: sp.day,
    start: sp.start ?? '11:30',
    min: Number(sp.min ?? 3),
    max: Number(sp.max ?? 6),
    intro: sp.intro ?? '',
    cost: sp.cost ?? '',
    request: sp.request,
  }
  const { recruiting } = await hostThemes(v.host.id)
  const preview = recruiting[0]
  const blocked = v.host.status !== '확인 완료'
  const lead = (
    <div className="mt-1.5 text-[13px] leading-5 text-sub">
      나머지 코스는 초안으로 채워 드려요. 3분이면 끝나요.
    </div>
  )
  const note = (
    <Note className="mt-4">
      {blocked ? (
        <>
          운영팀 확인이 끝나면 게시할 수 있어요. 초안은 미리 만들어 볼 수 있어요.{' '}
          <Link href="/host/join" className="text-ink">
            확인 상태 보기
          </Link>
        </>
      ) : (
        '모집 마감까지 최소 인원이 안 차면 자동으로 취소돼요. 준비해 둘 것은 없어요.'
      )}
    </Note>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="테마 등록" back="/host" />
        <div className="px-5">
          <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
            네 가지만 알려주세요
          </h1>
          {lead}
          <NewThemeForm id="new-m" places={list} days={strip} d={defaults} maxDay={maxDay} />
          {note}
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="new-m" size="lg" icon="sparkle" block>
              코스 초안 만들기
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="flex items-start gap-[72px]">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
              네 가지만 알려주세요
            </h1>
            {lead}
            <NewThemeForm id="new-d" places={list} days={strip} d={defaults} maxDay={maxDay} />
            {note}
            <div className="mt-6">
              <Button type="submit" form="new-d" size="lg" icon="sparkle" block>
                코스 초안 만들기
              </Button>
            </div>
          </div>
          {preview && (
            <div className="sticky top-6 w-[400px] flex-none">
              <div className="mb-3 text-[16px] font-extrabold tracking-[-0.03em]">
                참여자에게 이렇게 보여요
              </div>
              <ThemeTile t={preview} />
            </div>
          )}
        </div>
      </DesktopFrame>
    </>
  )
}
