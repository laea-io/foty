import type { Metadata } from 'next'
import { Field, TextArea, TextInput } from '@/components/c/form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Avatar, ButtonLink, DemoNote } from '@/components/ui/primitives'
import { myHost } from '@/lib/demo/host'

export const metadata: Metadata = { title: '프로필 편집' }

function Body() {
  return (
    <>
      <div className="mt-4 flex flex-col items-center">
        <Avatar name={myHost.name} size={84} />
        <label className="mt-2.5 cursor-pointer text-[13px] font-semibold">
          사진 바꾸기
          <input type="file" accept="image/*" className="sr-only" />
        </label>
      </div>
      <div className="mt-6 flex flex-col gap-[18px]">
        <Field label="상호" htmlFor="name">
          <TextInput id="name" defaultValue={myHost.name} />
        </Field>
        <Field label="위치" htmlFor="loc">
          <div className="relative">
            <Icon name="pin" size={18} className="absolute top-4 left-4 text-sub" />
            <TextInput id="loc" defaultValue={`남양주시 ${myHost.area}`} className="pl-11" />
          </div>
        </Field>
        <Field label="소개" htmlFor="intro">
          <TextArea
            id="intro"
            rows={3}
            defaultValue="두물머리 근처에서 20년째 한정식을 차려요. 토요일 점심에 자리를 비워 둘게요."
          />
        </Field>
        <Field label="담당자 연락 수단" htmlFor="contact">
          <TextInput id="contact" defaultValue="카카오톡 채널" />
          <div className="mt-1.5 text-[12px] text-muted">참여자에게는 보이지 않아요</div>
        </Field>
      </div>
      <div className="mt-6 flex items-start gap-2.5 rounded-[16px] bg-face px-4 py-3.5">
        <Icon name="shield" size={18} className="mt-0.5" />
        <div className="text-[13px] leading-5">
          <b>사업장 확인</b> 11월 20일 확인 ·{' '}
          <span className="text-sub">상호나 위치를 바꾸면 다시 확인해요</span>
        </div>
      </div>
    </>
  )
}

export default function HostEditPage() {
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="프로필 편집" back="/host" />
        <div className="px-5">
          <Body />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <ButtonLink href="/host" size="lg" block>
              저장하기
            </ButtonLink>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">호스트</div>
          <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.04em]">프로필 편집</h1>
          <Body />
          <div className="mt-6">
            <ButtonLink href="/host" size="lg" block>
              저장하기
            </ButtonLink>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
