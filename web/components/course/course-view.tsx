import Link from 'next/link'
import { CourseActions } from '@/components/course/course-actions'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { ThemeRow } from '@/components/theme/cards'
import { MapSketch, StopList } from '@/components/theme/parts'
import { Icon } from '@/components/ui/icon'
import { Badge, DemoNote, Photo, Segmented } from '@/components/ui/primitives'
import type { CourseData as Course } from '@/lib/server/queries/places'

/** 코스 — 일정(기본) / 지도. 모바일은 탭 전환, 데스크톱은 왼쪽 일정 + 오른쪽 지도 */
export function CourseView({ c, view }: { c: Course; view: 'list' | 'map' }) {
  const q = `?place=${c.place.id}`
  const tabs = [
    { href: `/course${q}`, label: '일정' },
    { href: `/course/map${q}`, label: '지도' },
  ]
  const fixedIdx = Math.max(
    0,
    c.stops.findIndex((s) => s.fixed),
  )
  const fixed = c.stops[fixedIdx]
  const title = `${c.place.name} 코스`

  return (
    <>
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5">
          {view === 'list' ? (
            <h1 className="mt-1.5 mb-3.5 text-[22px] font-extrabold tracking-[-0.04em]">
              가고 싶은 곳 하나로
              <br />
              하루 코스를 받아요
            </h1>
          ) : (
            <h1 className="mt-1.5 mb-3.5 text-[22px] font-extrabold tracking-[-0.04em]">{title}</h1>
          )}
          {view === 'list' && <CorePlace c={c} />}
          {view === 'list' && <Facts c={c} />}
          <div className={view === 'list' ? 'mt-4' : ''}>
            <Segmented items={tabs} current={tabs[view === 'list' ? 0 : 1].href} />
          </div>
          {view === 'list' ? (
            <StopList stops={c.stops} className="mt-1" />
          ) : (
            <>
              <MapSketch count={c.stops.length} stops={c.stops} height={430} className="mt-3" />
              {fixed && (
                <Link
                  href={`/course${q}`}
                  className="mt-3 flex items-center gap-3 rounded-[16px] p-2.5 text-ink no-underline shadow-[inset_0_0_0_1px_var(--color-line)]"
                >
                  <Photo
                    src={fixed.image.src}
                    alt={fixed.image.alt}
                    bg={fixed.image.bg}
                    className="h-14 w-14 rounded-[14px]"
                  />
                  <div className="grow">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold">
                        {fixedIdx + 1} · {fixed.name}
                      </span>
                      <Badge tone="ink">고정</Badge>
                    </div>
                    <div className="mt-0.5 text-[12px] text-sub">
                      {fixed.time} · {fixed.stay} · {fixed.checked ? `${fixed.checked} 확인` : '재확인 필요'}
                    </div>
                  </div>
                  <Icon name="chevron" size={14} weight={1.8} className="text-muted" />
                </Link>
              )}
            </>
          )}
          <div className="mt-2">
            <CourseActions title={title} c={c} />
          </div>
          {view === 'list' && <OpenThemes c={c} />}
          <DemoNote />
        </div>
      </MobileFrame>

      <DesktopFrame>
        <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
          가고 싶은 곳 하나로 하루 코스를 받아요
        </h1>
        <div className="mt-7 flex items-start gap-10">
          <div className="w-[480px] flex-none">
            <CorePlace c={c} wide />
            <Facts c={c} wide />
            <StopList stops={c.stops} className="mt-1" />
            <div className="mt-2.5">
              <CourseActions title={title} c={c} wide />
            </div>
            <OpenThemes c={c} wide />
          </div>
          <div className="sticky top-6 min-w-0 flex-1">
            <MapSketch count={c.stops.length} stops={c.stops} height={640} />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}

function CorePlace({ c, wide }: { c: Course; wide?: boolean }) {
  return (
    <Link
      href={`/course/pick?place=${c.place.id}`}
      className="flex items-center gap-3 rounded-[16px] bg-face p-2.5 text-ink no-underline"
    >
      <Photo
        src={c.place.image.src}
        alt={c.place.image.alt}
        bg={c.place.image.bg}
        className="h-14 w-14 rounded-[14px]"
      />
      <span className="grow">
        <span className={`block text-sub ${wide ? 'text-[12px]' : 'text-[11px]'}`}>핵심 장소</span>
        <span className={`block font-bold tracking-[-0.02em] ${wide ? 'text-[17px]' : 'text-[16px]'}`}>
          {c.place.name}
        </span>
      </span>
      <span className="mr-2 text-[13px] text-sub">바꾸기</span>
    </Link>
  )
}

function Facts({ c, wide }: { c: Course; wide?: boolean }) {
  const items = [
    ['날짜', c.date],
    ['총 시간', c.hours],
    ['예상 비용', c.cost],
    ['이동', c.move],
  ]
  return (
    <div className="mt-4 flex border-y border-line py-3.5">
      {items.map(([k, v]) => (
        <div key={k} className="flex-1">
          <div className={`text-muted ${wide ? 'text-[12px]' : 'text-[11px]'}`}>{k}</div>
          <div className={`mt-0.5 font-bold ${wide ? 'text-[15px]' : 'text-[14px]'}`}>{v}</div>
        </div>
      ))}
    </div>
  )
}

function OpenThemes({ c, wide }: { c: Course; wide?: boolean }) {
  if (!c.open.length) return null
  return (
    <>
      <div className={`mb-3 flex items-baseline justify-between ${wide ? 'mt-9' : 'mt-8'}`}>
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">이 코스에 열린 테마</h2>
      </div>
      <div className="-mt-2">
        {c.open.map((t) => (
          <ThemeRow key={t.id} t={t} />
        ))}
      </div>
    </>
  )
}
