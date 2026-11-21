import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChipGroup, Field, Stepper } from '@/components/c/form'
import { DayStrip } from '@/components/host/day-strip'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeMini } from '@/components/theme/cards'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'
import { type Theme, themeById } from '@/lib/demo/themes'

export const metadata: Metadata = { title: '날짜 추가' }

function Body({ t }: { t: Theme }) {
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        같은 테마를 다른 날에 또 열어요
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">핵심 장소와 코스는 그대로 가져와요.</div>
      <ThemeMini t={t} className="mt-4" />
      <div className="mt-[22px] flex flex-col gap-[22px]">
        <Field label="날짜">
          <DayStrip defaultDay={22} />
        </Field>
        <Field label="시간">
          <ChipGroup options={['11:30', '12:30', '17:30', '직접 입력']} defaultValue={t.start} />
        </Field>
        <Field label="인원">
          <div className="flex gap-2">
            <Stepper label="최소" value={t.min} min={2} max={t.max} />
            <Stepper label="최대" value={t.max} min={t.min} max={8} />
          </div>
        </Field>
      </div>
      <Note className="mt-4">모집 마감은 전날 18:00로 잡혀요. 최소 인원이 안 차면 자동 취소돼요.</Note>
    </>
  )
}

export default async function AddDatePage({ params }: { params: Promise<{ id: string }> }) {
  const t = themeById((await params).id)
  if (!t) notFound()
  const cta = (
    <ButtonLink href="/host" size="lg" block>
      이 날짜로 게시하기
    </ButtonLink>
  )
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="날짜 추가" back="/host" />
        <div className="px-5">
          <Body t={t} />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">{cta}</div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">날짜 추가</div>
          <Body t={t} />
          <div className="mt-6">{cta}</div>
        </div>
      </DesktopFrame>
    </>
  )
}
