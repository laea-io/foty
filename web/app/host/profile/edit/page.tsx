import type { Metadata } from 'next'
import { editHostAction } from '@/app/actions/host'
import { Field, TextArea, TextInput } from '@/components/forms/fields'
import { ActionForm } from '@/components/forms/locked-form'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Icon } from '@/components/ui/icon'
import { Avatar, Button, DemoNote } from '@/components/ui/primitives'
import { requireHost, type Viewer } from '@/lib/server/auth/session'
import { dayLabel, today } from '@/lib/server/util/time'

export const metadata: Metadata = { title: '프로필 편집' }

type H = NonNullable<Viewer['host']>

function Body({ h, id }: { h: H; id: string }) {
  const biz = h.kind === 'business'
  const mark = biz ? '사업장 확인' : '남양주 주민 인증'
  return (
    <ActionForm id={id} action={editHostAction}>
      <div className="mt-4 flex flex-col items-center">
        <Avatar name={h.name} size={84} />
      </div>
      <div className="mt-6 flex flex-col gap-[18px]">
        <Field label={biz ? '상호' : '이름'} htmlFor={`${id}-name`}>
          <TextInput id={`${id}-name`} name="name" defaultValue={h.name} readOnly={!biz} required />
        </Field>
        <Field label={biz ? '위치' : '사는 동네'} htmlFor={`${id}-loc`}>
          <div className="relative">
            <Icon name="pin" size={18} className="absolute top-4 left-4 text-sub" />
            <TextInput
              id={`${id}-loc`}
              name="area"
              defaultValue={`남양주시 ${h.area}`}
              className="pl-11"
              required
            />
          </div>
        </Field>
        <Field label="소개" htmlFor={`${id}-intro`}>
          <TextArea id={`${id}-intro`} name="intro" rows={3} defaultValue={h.intro} maxLength={200} />
        </Field>
        <Field label="담당자 연락 수단" htmlFor={`${id}-contact`}>
          <TextInput id={`${id}-contact`} name="contact" defaultValue={h.contact} />
          <div className="mt-1.5 text-[12px] text-muted">참여자에게는 보이지 않아요</div>
        </Field>
      </div>
      <div className="mt-6 flex items-start gap-2.5 rounded-[16px] bg-face px-4 py-3.5">
        <Icon name="shield" size={18} className="mt-0.5" />
        <div className="text-[13px] leading-5">
          <b>{mark}</b>{' '}
          {h.status === '확인 완료' && h.verifiedAt ? `${dayLabel(today(h.verifiedAt))} 확인` : h.status} ·{' '}
          <span className="text-sub">
            {biz ? '상호나 위치를 바꾸면 다시 확인해요' : '동네를 바꾸면 운영팀이 다시 확인할 수 있어요'}
          </span>
        </div>
      </div>
    </ActionForm>
  )
}

export default async function HostEditPage() {
  const v = await requireHost('/host/profile/edit')
  return (
    <>
      <MobileFrame bottom>
        <BackBar title="프로필 편집" back="/host" />
        <div className="px-5">
          <Body h={v.host} id="edit-m" />
          <DemoNote />
        </div>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="edit-m" size="lg" block>
              저장하기
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>
      <DesktopFrame>
        <div className="mx-auto max-w-[600px]">
          <div className="mb-2 text-[14px] text-sub">호스트</div>
          <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.04em]">프로필 편집</h1>
          <Body h={v.host} id="edit-d" />
          <div className="mt-6">
            <Button type="submit" form="edit-d" size="lg" block>
              저장하기
            </Button>
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}
