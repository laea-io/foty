import Link from 'next/link'
import { Field, TextInput } from '@/components/forms/fields'
import { Icon } from '@/components/ui/icon'
import { hostKinds } from '@/lib/shared/people'

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

export function BusinessFields({
  d,
  readOnly,
}: {
  d?: { name: string; area: string; contact: string }
  readOnly?: boolean
}) {
  return (
    <div className="mt-[22px] flex flex-col gap-[18px]">
      <input type="hidden" name="kind" value="business" />
      <Field label="상호" htmlFor="biz-name">
        <TextInput
          id="biz-name"
          name="name"
          defaultValue={d?.name}
          placeholder="다산 한정식"
          readOnly={readOnly}
          required
        />
      </Field>
      <Field label="위치" htmlFor="biz-loc">
        <div className="relative">
          <Icon name="pin" size={18} className="absolute top-4 left-4 text-sub" />
          <TextInput
            id="biz-loc"
            name="area"
            defaultValue={d ? `남양주시 ${d.area}` : ''}
            placeholder="남양주시 조안면"
            className="pl-11"
            readOnly={readOnly}
            required
          />
        </div>
      </Field>
      <ContactField
        id="biz-contact"
        label="담당자 연락 수단"
        placeholder="카카오톡 채널 · 전화"
        defaultValue={d?.contact}
        readOnly={readOnly}
      />
    </div>
  )
}

/** 운영팀이 확인 연락을 드릴 연락 수단(사업장 · 주민 공통, hosts.contact에 저장) */
export function ContactField({
  id,
  label = '연락 수단',
  placeholder = '카카오톡 아이디 · 전화',
  defaultValue,
  readOnly,
  required,
}: {
  id: string
  label?: string
  placeholder?: string
  defaultValue?: string
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <Field label={label} htmlFor={id}>
      <TextInput
        id={id}
        name="contact"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={60}
        readOnly={readOnly}
        required={required}
      />
    </Field>
  )
}

type Step = { title: string; desc: string; state: 'done' | 'now' | 'next' }

/** 확인 진행 상태(1 제출 → 2 확인 중 → 3 권한). status = hosts.status, 없으면 아직 제출 전 */
export function JoinProgress({
  status,
  submitted,
  kind = 'business',
}: {
  status?: '확인 대기' | '확인 완료' | '보류' | '정지' | null
  submitted?: string
  kind?: 'business' | 'resident'
}) {
  const what = kind === 'business' ? '영업 중인 사업장인지' : '남양주 주민인지'
  const mark = kind === 'business' ? '사업장 확인' : '남양주 주민 인증'
  const steps: Step[] = !status
    ? [
        { title: '정보 제출', desc: '아래 정보를 적어 보내 주세요', state: 'now' },
        { title: '운영팀 확인', desc: `${what} 확인해요`, state: 'next' },
        { title: '호스트 권한', desc: `확인되면 프로필에 ${mark}이 표시돼요`, state: 'next' },
      ]
    : status === '확인 완료'
      ? [
          { title: '정보 제출', desc: `${submitted ?? ''} 제출했어요`, state: 'done' },
          { title: '운영팀 확인', desc: '확인됐어요', state: 'done' },
          { title: '호스트 권한', desc: `프로필에 ${mark}이 표시돼요`, state: 'done' },
        ]
      : [
          { title: '정보 제출', desc: `${submitted ?? ''} 제출했어요`, state: 'done' },
          {
            title: status === '보류' ? '확인 보류' : status === '정지' ? '권한 정지' : '운영팀 확인 중',
            desc:
              status === '보류'
                ? '운영팀이 연락드릴 거예요'
                : status === '정지'
                  ? '신고 확인으로 테마 등록이 멈췄어요'
                  : `${what} 확인하고 있어요`,
            state: 'now',
          },
          { title: '호스트 권한', desc: `확인되면 프로필에 ${mark}이 표시돼요`, state: 'next' },
        ]
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
