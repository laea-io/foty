import type { Metadata } from 'next'
import { ChipGroup, Field, Stepper, TextInput } from '@/components/c/form'
import { DayStrip } from '@/components/host/day-strip'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeTile } from '@/components/theme/cards'
import { Icon } from '@/components/ui/icon'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'
import { hostThemes } from '@/lib/demo/host'

export const metadata: Metadata = { title: '테마 등록' }

function Fields() {
  return (
    <div className="mt-[22px] flex flex-col gap-[22px]">
      <Field label="핵심 장소" htmlFor="core">
        <div className="relative">
          <Icon name="pin" size={18} className="absolute top-4 left-4 text-sub" />
          <TextInput id="core" defaultValue="다산 한정식 · 조안면" className="pl-11" />
        </div>
      </Field>
      <Field label="날짜와 시간">
        <DayStrip />
        <div className="mt-2">
          <ChipGroup options={['11:30', '12:30', '17:30', '직접 입력']} defaultValue="11:30" />
        </div>
      </Field>
      <Field label="인원">
        <div className="flex gap-2">
          <Stepper label="최소 (이만큼 모이면 성사)" value={3} min={2} max={6} />
          <Stepper label="최대" value={6} min={3} max={8} />
        </div>
      </Field>
      <Field label="한 줄 소개" htmlFor="intro">
        <TextInput id="intro" defaultValue="토요일 점심, 여섯 분 자리를 비워 둘게요" />
      </Field>
      <Field
        htmlFor="cost"
        label={
          <>
            예상 비용 <span className="font-normal text-muted">선택</span>
          </>
        }
      >
        <TextInput id="cost" defaultValue="1인 2.5만원 내외" />
      </Field>
    </div>
  )
}

const lead = (
  <div className="mt-1.5 text-[13px] leading-5 text-sub">
    나머지 코스는 초안으로 채워 드려요. 3분이면 끝나요.
  </div>
)
const note = (
  <Note className="mt-4">모집 마감까지 최소 인원이 안 차면 자동으로 취소돼요. 준비해 둘 것은 없어요.</Note>
)

export default function HostNewPage() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="테마 등록" back="/host" />
        <div className="px-5">
          <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
            네 가지만 알려주세요
          </h1>
          {lead}
          <Fields />
          {note}
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/host/new/draft" size="lg" icon="sparkle" block>
              코스 초안 만들기
            </ButtonLink>
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
            <Fields />
            {note}
            <div className="mt-6">
              <ButtonLink href="/host/new/draft" size="lg" icon="sparkle" block>
                코스 초안 만들기
              </ButtonLink>
            </div>
          </div>
          <div className="sticky top-6 w-[400px] flex-none">
            <div className="mb-3 text-[16px] font-extrabold tracking-[-0.03em]">참여자에게 이렇게 보여요</div>
            <ThemeTile t={hostThemes.recruiting} href="/themes/dasan-lunch" />
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
