import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { joinHostAction } from '@/app/actions/c'
import { Field, TextInput } from '@/components/c/form'
import { ActionForm } from '@/components/host/action-form'
import { ContactField, KindPicker } from '@/components/host/join'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Button, DemoNote, Note } from '@/components/ui/primitives'
import { requireViewer } from '@/lib/server/auth'

export const metadata: Metadata = { title: '호스트 등록 — 주민' }

function Body({ id }: { id: string }) {
  return (
    <ActionForm id={id} action={joinHostAction}>
      <input type="hidden" name="kind" value="resident" />
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
        <Field label="사는 동네" htmlFor={`${id}-area`}>
          <div className="relative">
            <Icon name="pin" size={18} className="absolute top-4 left-4 text-sub" />
            <TextInput
              id={`${id}-area`}
              name="area"
              placeholder="남양주시 조안면"
              className="pl-11"
              required
            />
          </div>
        </Field>
        <Field label="소개 한 줄" htmlFor={`${id}-intro`}>
          <TextInput
            id={`${id}-intro`}
            name="intro"
            placeholder="두물머리 근처에서 15년째 살아요"
            maxLength={80}
          />
        </Field>
        <ContactField id={`${id}-contact`} label="연락받을 곳" required />
        <Field label="인증 방법">
          <div className="flex h-[50px] items-center gap-2 rounded-[14px] bg-face px-4 text-[15px]">
            <Icon name="shield" size={18} />
            운영팀이 직접 확인해요
          </div>
        </Field>
      </div>
      <div className="mt-3 text-[13px] leading-5 text-sub">
        지금은 운영팀이 적어 주신 연락처로 연락드려 주민인지 확인해요. 확인되면 프로필에 남양주 주민 인증이
        표시돼요.
      </div>
      <Note className="mt-4">인증 표시는 주민이라는 사실만 알려줘요. 안전을 보장하는 표시는 아니에요.</Note>
    </ActionForm>
  )
}

export default async function ResidentJoinPage() {
  const v = await requireViewer('/host/join/resident')
  if (v.host) redirect('/host/join')
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="호스트 등록" back="/my" />
        <div className="px-5">
          <Body id="res-m" />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="res-m" size="lg" block>
              확인 요청 보내기
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <Body id="res-d" />
          <div className="mt-6">
            <Button type="submit" form="res-d" size="lg" block>
              확인 요청 보내기
            </Button>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
