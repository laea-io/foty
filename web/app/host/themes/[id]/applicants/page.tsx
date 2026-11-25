import type { Metadata } from 'next'
import { Applicants } from '@/components/host/applicants'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { DemoNote, Photo, Progress } from '@/components/ui/primitives'
import { applicantsOf, ownTheme } from '@/lib/server/queries/host'
import type { ThemeView } from '@/lib/server/queries/themes'

export const metadata: Metadata = { title: '신청 현황' }

async function Body({ t }: { t: ThemeView }) {
  const list = await applicantsOf(t.id)
  return (
    <>
      <div className="mt-2 flex items-center gap-3">
        <Photo src={t.image.src} alt={t.image.alt} bg={t.image.bg} className="h-14 w-14 rounded-[14px]" />
        <div className="min-w-0">
          <div className="text-[16px] font-bold tracking-[-0.02em]">{t.title}</div>
          <div className="mt-0.5 text-[12px] text-sub">
            {t.date} {t.start} · {t.place}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Progress current={t.current} max={t.max} min={t.min} deadline={t.deadline} />
      </div>
      <Applicants themeId={t.id} list={list} min={t.min} current={t.current} />
    </>
  )
}

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await ownTheme(id, `/host/themes/${id}/applicants`)
  return (
    <>
      <MobileFrame>
        <BackBar title="신청 현황" back="/host" />
        <div className="px-5">
          <Body t={t} />
          <DemoNote />
        </div>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[680px]">
          <div className="mb-2 text-[14px] text-sub">내 테마</div>
          <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">신청 현황</h1>
          <Body t={t} />
        </div>
      </DesktopFrame>
    </>
  )
}
