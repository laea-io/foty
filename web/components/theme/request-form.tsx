'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { requestAction } from '@/app/actions/themes'
import { BackBar, BottomBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { Button, Chip, DemoNote } from '@/components/ui/primitives'
import { activityList } from '@/lib/shared/theme'

const days = ['이번 주말', '다음 주말', '평일도 좋아요']

/** 테마 요청(이런 테마가 있으면 가고 싶어요) — theme_requests에 남기고 홈으로 */
export function RequestForm() {
  const router = useRouter()
  const [acts, setActs] = useState<string[]>(['산책', '맛집'])
  const [day, setDay] = useState('다음 주말')
  const [text, setText] = useState('')
  const [state, action, pending] = useActionState(requestAction, undefined)
  const sent = !!state?.ok
  const toggle = (a: string) => setActs(acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a])
  useEffect(() => {
    if (sent) router.push('/')
  }, [sent, router])
  const label = sent ? '요청을 남겼어요' : '요청 남기기'
  const error = state?.error ? <div className="mb-2 text-[13px] text-warn">{state.error}</div> : null
  const hidden = (
    <>
      {acts.map((a) => (
        <input key={a} type="hidden" name="tags" value={a} />
      ))}
      <input type="hidden" name="when" value={day} />
    </>
  )

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
          name="body"
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
        <form id="request-m" action={action} className="px-5">
          {hidden}
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
            {error}
            <Button type="submit" form="request-m" size="lg" block disabled={sent || pending}>
              {label}
            </Button>
          </div>
        </BottomBar>
      </MobileFrame>

      <DesktopFrame>
        <form action={action} className="mx-auto max-w-[560px]">
          {hidden}
          <h1 className="m-0 text-[30px] leading-[38px] font-extrabold tracking-[-0.05em]">
            이런 테마가 있으면 가고 싶어요
          </h1>
          <div className="mt-2 text-[15px] text-sub">남양주의 호스트가 요청을 보고 테마를 열 수 있어요.</div>
          {fields(true)}
          <div className="mt-7">
            {error}
            <Button type="submit" size="lg" block disabled={sent || pending}>
              {label}
            </Button>
          </div>
        </form>
      </DesktopFrame>
    </>
  )
}
