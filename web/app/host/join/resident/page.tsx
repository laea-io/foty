import type { Metadata } from 'next'
import { Field, TextInput } from '@/components/c/form'
import { KindPicker } from '@/components/host/join'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { ButtonLink, DemoNote, Note } from '@/components/ui/primitives'

export const metadata: Metadata = { title: '호스트 등록 — 주민' }

function Body() {
  return (
    <>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        남양주 주민으로
        <br />
        테마를 열어요
      </h1>
      <div className="mt-1.5 text-[13px] leading-5 text-sub">
        동네를 아는 사람이 여는 테마예요. 주민 인증을 거친 뒤 열 수 있어요.
      </div>
      <KindPicker current="resident" />
      <div className="mt-[22px] flex flex-col gap-[18px]">
        <Field label="사는 동네" htmlFor="res-area">
          <div className="relative">
            <Icon name="pin" size={18} className="absolute top-4 left-4 text-sub" />
            <TextInput id="res-area" defaultValue="남양주시 조안면" className="pl-11" />
          </div>
        </Field>
        <Field label="소개 한 줄" htmlFor="res-intro">
          <TextInput id="res-intro" defaultValue="두물머리 근처에서 15년째 살아요" />
        </Field>
        <Field label="인증 방법">
          <div className="flex h-[50px] items-center gap-2 rounded-[14px] bg-face px-4 text-[15px]">
            <Icon name="shield" size={18} />
            운영팀이 직접 확인해요
          </div>
        </Field>
      </div>
      <div className="mt-3 text-[13px] leading-5 text-sub">
        지금은 운영팀이 연락드려 주민인지 확인해요. 확인되면 프로필에 남양주 주민 인증이 표시돼요.
      </div>
      <Note className="mt-4">인증 표시는 주민이라는 사실만 알려줘요. 안전을 보장하는 표시는 아니에요.</Note>
    </>
  )
}

export default function ResidentJoinPage() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="호스트 등록" back="/my" />
        <div className="px-5">
          <Body />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/host/join" size="lg" block>
              확인 요청 보내기
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <Body />
          <div className="mt-6">
            <ButtonLink href="/host/join" size="lg" block>
              확인 요청 보내기
            </ButtonLink>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
