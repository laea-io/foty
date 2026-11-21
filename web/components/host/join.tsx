import Link from 'next/link'
import { Field, TextInput } from '@/components/c/form'
import { Icon } from '@/components/ui/icon'
import { hostKinds } from '@/lib/demo/host'

/** 가게·관광지 / 남양주 주민 고르기(링크로 화면 전환) */
export function KindPicker({ current }: { current: 'business' | 'resident' }) {
  return (
    <div className="mt-[22px] flex gap-2">
      {hostKinds.map((k) => {
        const on = k.id === current
        return (
          <Link
            key={k.id}
            href={k.href}
            aria-current={on ? 'page' : undefined}
            className={`flex-1 rounded-[16px] p-4 no-underline ${on ? 'bg-ink text-white' : 'bg-face text-ink'}`}
          >
            <div className="text-[15px] font-bold">{k.title}</div>
            <div className={`mt-1 text-[12px] ${on ? 'text-white/65' : 'text-sub'}`}>{k.sub}</div>
          </Link>
        )
      })}
    </div>
  )
}

export function BusinessFields() {
  return (
    <div className="mt-[22px] flex flex-col gap-[18px]">
      <Field label="상호" htmlFor="biz-name">
        <TextInput id="biz-name" defaultValue="다산 한정식" />
      </Field>
      <Field label="위치" htmlFor="biz-loc">
        <div className="relative">
          <Icon name="pin" size={18} className="absolute top-4 left-4 text-sub" />
          <TextInput id="biz-loc" defaultValue="남양주시 조안면" className="pl-11" />
        </div>
      </Field>
      <Field label="담당자 연락 수단" htmlFor="biz-contact">
        <TextInput id="biz-contact" defaultValue="카카오톡 채널" />
      </Field>
    </div>
  )
}

const steps = [
  { title: '정보 제출', desc: '11월 19일 제출했어요', state: 'done' },
  { title: '운영팀 확인 중', desc: '영업 중인 사업장인지 확인하고 있어요', state: 'now' },
  { title: '호스트 권한', desc: '확인되면 프로필에 사업장 확인이 표시돼요', state: 'next' },
] as const

/** 확인 진행 상태(1 제출 → 2 확인 중 → 3 권한) */
export function JoinProgress() {
  return (
    <div className="rounded-[16px] px-[18px] py-1.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
      {steps.map((s, i) => (
        <div key={s.title} className="flex gap-3 py-3">
          <span
            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[12px] font-bold ${
              s.state === 'next' ? 'bg-face text-muted' : 'bg-ink text-white'
            }`}
          >
            {s.state === 'done' ? <Icon name="check" size={14} weight={2.2} /> : i + 1}
          </span>
          <div>
            <div
              className={`text-[14px] ${s.state === 'now' ? 'font-bold' : 'font-medium'} ${s.state === 'next' ? 'text-muted' : 'text-ink'}`}
            >
              {s.title}
            </div>
            <div className="mt-px text-[12px] text-sub">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
