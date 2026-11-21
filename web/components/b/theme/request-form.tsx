'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, Chip, DemoNote } from '@/components/ui/primitives'
import { activityList } from '@/lib/demo/themes'

const days = ['이번 주말', '다음 주말', '평일도 좋아요']

/** 테마 요청(이런 테마가 있으면 가고 싶어요) — 시연에서는 보내면 홈으로 */
export function RequestForm() {
  const router = useRouter()
  const [acts, setActs] = useState<string[]>(['산책', '맛집'])
  const [day, setDay] = useState('다음 주말')
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const toggle = (a: string) => setActs(acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
    router.push('/')
  }
  const label = sent ? '요청을 남겼어요' : '요청 남기기'

  const fields = (wide: boolean) => (
    <div className={`flex flex-col ${wide ? 'mt-9 gap-7' : 'mt-[26px] gap-6'}`}>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2.5 p-0 text-[13px] font-semibold">하고 싶은 것</legend>
        <div className="flex flex-wrap gap-2">
          {activityList.map((a) => (
            <Chip key={a} selected={acts.includes(a)} onClick={() => toggle(a)}>
              {a}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2.5 p-0 text-[13px] font-semibold">가능한 날</legend>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Chip key={d} selected={day === d} onClick={() => setDay(d)}>
              {d}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={wide ? 'req-text-w' : 'req-text'} className="mb-2 block text-[13px] font-semibold">
          조금 더 알려주세요 <span className="font-normal text-muted">선택</span>
        </label>
        <textarea
          id={wide ? 'req-text-w' : 'req-text'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="두부 요리 잘하는 집에서 점심 먹고 가볍게 걷는 코스요."
          className={`block w-full resize-none rounded-[14px] border-0 bg-face text-[15px] leading-[23px] text-ink outline-none placeholder:text-muted ${
            wide ? 'h-[130px] px-[18px] py-4' : 'h-[110px] px-4 py-3.5'
          }`}
        />
        <div className={`mt-4 text-muted ${wide ? 'text-[13px]' : 'text-[12px] leading-[18px]'}`}>
          요청이 테마로 열리면 알림을 보내드려요. 테마가 꼭 열린다고 약속하지는 않아요.
        </div>
      </div>
    </div>
  )

  return (
    <>
      <MobileFrame bottom>
        <BackBar title="테마 요청" />
        <form id="request-m" onSubmit={submit} className="px-5">
          <h1 className="mt-4 mb-1 text-[22px] leading-[29px] font-extrabold tracking-[-0.04em]">
            이런 테마가 있으면
            <br />
            가고 싶어요
          </h1>
          <div className="text-[13px] text-sub">남양주의 호스트가 요청을 보고 테마를 열 수 있어요.</div>
          {fields(false)}
          <DemoNote />
        </form>
        <BottomBar>
          <div className="grow">
            <Button type="submit" form="request-m" size="lg" block disabled={sent}>
              {label}
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>

      <DesktopFrame>
        <form onSubmit={submit} className="mx-auto max-w-[560px]">
          <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
            이런 테마가 있으면 가고 싶어요
          </h1>
          <div className="mt-2 text-[15px] text-sub">남양주의 호스트가 요청을 보고 테마를 열 수 있어요.</div>
          {fields(true)}
          <div className="mt-7">
            <Button type="submit" size="lg" block disabled={sent}>
              {label}
            </Button>
          </div>
        </form>
      </DesktopFrame>
    </>
  )
}
