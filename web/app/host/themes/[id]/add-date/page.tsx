import type { Metadata } from 'next'
import { addDateAction } from '@/app/actions/host'
import { Field, Stepper, TextInput } from '@/components/forms/fields'
import { ActionForm } from '@/components/forms/locked-form'
import { DayStrip } from '@/components/host/day-strip'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeMini } from '@/components/theme/cards'
import { Button, DemoNote, Note } from '@/components/ui/primitives'
import { ownTheme } from '@/lib/server/queries/host'
import { type ThemeView, weekStrip } from '@/lib/server/queries/themes'
import { addDays, kst } from '@/lib/server/util/time'

export const metadata: Metadata = { title: '날짜 추가' }

function Body({ t, id }: { t: ThemeView; id: string }) {
  const now = new Date()
  const days = [...weekStrip(now), ...weekStrip(new Date(now.getTime() + 7 * 86400000))]
    .filter((d) => d.iso !== t.day && kst(addDays(d.iso, -1), '18:00') > now)
    .slice(0, 7)
  return (
    <ActionForm id={id} action={addDateAction}>
      <input type="hidden" name="theme" value={t.id} />
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        같은 테마를 다른 날에 또 열어요
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">핵심 장소와 코스는 그대로 가져와요.</div>
      <ThemeMini t={t} className="mt-4" />
      <div className="mt-[22px] flex flex-col gap-[22px]">
        <Field label="날짜">
          <DayStrip days={days} name="day" max={days.length ? addDays(days[0].iso, 60) : undefined} />
        </Field>
        <Field label="시간">
          <TextInput type="time" name="start" defaultValue={t.start} aria-label="시작 시간" required />
        </Field>
        <Field label="인원">
          <div className="flex gap-2">
            <Stepper name="min" label="최소" value={t.min} min={2} max={t.max} />
            <Stepper name="max" label="최대" value={t.max} min={t.min} max={12} />
          </div>
        </Field>
      </div>
      <Note className="mt-4">모집 마감은 전날 18:00로 잡혀요. 최소 인원이 안 차면 자동 취소돼요.</Note>
    </ActionForm>
  )
}

export default async function AddDatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await ownTheme(id, `/host/themes/${id}/add-date`)
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="날짜 추가" back="/host" />
        <div className="px-5">
          <Body t={t} id="add-m" />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="add-m" size="lg" block>
              이 날짜로 게시하기
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">날짜 추가</div>
          <Body t={t} id="add-d" />
          <div className="mt-6">
            <Button type="submit" form="add-d" size="lg" block>
              이 날짜로 게시하기
            </Button>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
