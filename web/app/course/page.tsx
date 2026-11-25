import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CourseView } from '@/components/course/course-view'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Badge, Photo } from '@/components/ui/primitives'
import { courseFor, type PlaceItem, searchPlaces } from '@/lib/server/queries/places'

export const metadata: Metadata = { title: '코스' }

/** 검색에서 왔을 때(?q=): 이름·지역·종류에 검색어가 들어간 장소 — 고르면 그 장소로 하루 코스 */
function PlaceResults({ q, places, wide }: { q: string; places: PlaceItem[]; wide?: boolean }) {
  return (
    <>
      <h1
        className={`mb-0 font-extrabold tracking-[-0.04em] ${wide ? 'mt-0 text-[30px] leading-[38px]' : 'mt-4 text-[22px] leading-[30px]'}`}
      >
        코스로 시작할 장소
      </h1>
      <div className="mt-2 flex items-center gap-2 text-[13px] text-sub">
        <Icon name="search" size={15} className="text-muted" />
        <span className="min-w-0 grow truncate">
          <b className="font-semibold text-ink">‘{q}’</b> 장소 {places.length}곳 · 한 곳을 고르면 하루 코스를
          붙여 드려요
        </span>
        <Link href="/course" className="inline-flex items-center gap-1 font-semibold text-ink no-underline">
          <Icon name="close" size={13} />
          검색어 지우기
        </Link>
      </div>
      <div className="mt-3">
        {places.map((p, i) => (
          <Link
            key={p.id}
            href={`/course?place=${p.id}`}
            className={`flex items-center gap-3.5 py-3 text-ink no-underline ${i ? 'border-t border-line' : ''}`}
          >
            <Photo
              src={p.image.src}
              alt={p.image.alt}
              bg={p.image.bg}
              className={`rounded-[12px] ${wide ? 'h-16 w-16' : 'h-14 w-14'}`}
            />
            <div className="min-w-0 grow">
              <div className="text-[15px] font-semibold">{p.name}</div>
              <div className="mt-0.5 text-[12px] text-sub">
                {p.area} · {p.kind}
              </div>
            </div>
            {p.open > 0 && <Badge>열린 테마 {p.open}</Badge>}
          </Link>
        ))}
        {!places.length && (
          <div className="py-12 text-center text-[13px] text-sub">
            맞는 장소가 없어요.{' '}
            <Link href="/course/pick" className="font-semibold text-ink">
              전체 장소에서 고르기
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

export default async function CoursePage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; ask?: string; q?: string }>
}) {
  const sp = await searchParams
  const q = (typeof sp.q === 'string' ? sp.q : '').trim().slice(0, 60)
  if (q && !sp.place) {
    const places = await searchPlaces(q)
    return (
      <>
        <MobileFrame tabbar>
          <BackBar title="코스 찾기" back={`/search?q=${encodeURIComponent(q)}`} />
          <div className="px-5 pb-10">
            <PlaceResults q={q} places={places} />
          </div>
        </MobileFrame>
        <DesktopFrame>
          <div className="mx-auto max-w-[640px]">
            <PlaceResults q={q} places={places} wide />
          </div>
        </DesktopFrame>
      </>
    )
  }
  const c = await courseFor(sp.place, sp.ask)
  if (!c) notFound()
  return <CourseView c={c} view="list" />
}
