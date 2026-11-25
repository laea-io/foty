import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { ButtonLink, DemoNote, Photo, Segmented } from '@/components/ui/primitives'
import { getViewer } from '@/lib/server/auth/session'
import { savedCourses as loadSaved, type SavedRow as SavedCourse } from '@/lib/server/queries/places'

export const metadata: Metadata = { title: '저장한 코스' }

type Row = SavedCourse

function Rows({ rows, size }: { rows: Row[]; size: string }) {
  return (
    <div>
      {rows.map((r, i) => (
        <Link
          key={r.id}
          href={`/course?place=${r.placeId}`}
          className={`flex items-center gap-3.5 py-3.5 text-ink no-underline ${i ? 'border-t border-line' : ''}`}
        >
          <Photo src={r.image.src} alt={r.image.alt} bg={r.image.bg} className={`rounded-[12px] ${size}`} />
          <div className="grow">
            <div className="text-[15px] font-semibold">{r.title}</div>
            <div className="mt-[3px] text-[12px] text-sub">{r.meta}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default async function SavedCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/course/saved')
  const savedCourses = await loadSaved(viewer.id)
  const imported = (await searchParams).tab === 'imported'
  const tabs = [
    { href: '/course/saved', label: `내가 만든 코스 ${savedCourses.mine.length}` },
    { href: '/course/saved?tab=imported', label: `가져온 코스 ${savedCourses.imported.length}` },
  ]
  const body = (size: string) => (
    <>
      <Segmented items={tabs} current={tabs[imported ? 1 : 0].href} />
      <div className="mt-2">
        <Rows rows={imported ? savedCourses.imported : savedCourses.mine} size={size} />
      </div>
      {!imported && (
        <>
          <div className="mt-7 mb-3 flex items-baseline justify-between">
            <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">가져온 코스</h2>
          </div>
          <Rows rows={savedCourses.imported} size={size} />
        </>
      )}
      <div className="mt-5">
        <ButtonLink href="/course/pick" variant="outline" icon="plus" block>
          새 코스 만들기
        </ButtonLink>
      </div>
    </>
  )
  return (
    <>
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5">
          <h1 className="mt-1.5 mb-3.5 text-[22px] font-extrabold tracking-[-0.04em]">저장한 코스</h1>
          {body('h-16 w-16')}
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">코스</div>
          <h1 className="mt-1.5 mb-3.5 text-[22px] font-extrabold tracking-[-0.04em]">저장한 코스</h1>
          {body('h-[72px] w-[72px]')}
        </div>
      </DesktopFrame>
    </>
  )
}
