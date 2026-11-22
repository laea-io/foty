'use client'

import { useState } from 'react'
import { ChipGroup, Field, Stepper, TextInput } from '@/components/c/form'
import { Icon } from '@/components/ui/icon'
import { DayStrip, type StripDay } from './day-strip'

export type NewThemeDefaults = {
  place: string
  day?: string
  start: string
  min: number
  max: number
  intro: string
  cost: string
  request?: string
}

const TIMES = ['11:30', '12:30', '17:30']

/** 네 가지만: 핵심 장소 · 날짜와 시간 · 인원 · 한 줄 소개(+ 예상 비용). 제출하면 코스 초안 화면으로(GET) */
export function NewThemeForm({
  id,
  places,
  maxDay,
  days,
  d,
}: {
  id: string
  places: { id: string; label: string; group?: string }[]
  /** 달력으로 고를 수 있는 마지막 날 */
  maxDay?: string
  days: StripDay[]
  d: NewThemeDefaults
}) {
  const [custom, setCustom] = useState(!TIMES.includes(d.start))
  const [start, setStart] = useState(d.start)
  return (
    <form id={id} method="get" action="/host/new/draft" className="mt-[22px] flex flex-col gap-[22px]">
      {d.request && <input type="hidden" name="request" value={d.request} />}
      <Field label="핵심 장소" htmlFor={`${id}-place`}>
        <div className="relative">
          <Icon name="pin" size={18} className="pointer-events-none absolute top-4 left-4 text-sub" />
          <select
            id={`${id}-place`}
            name="place"
            defaultValue={d.place}
            className="h-[50px] w-full appearance-none rounded-[14px] border-0 bg-face pr-4 pl-11 text-[15px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-ink"
          >
            {[...new Set(places.map((p) => p.group ?? '장소'))].map((g) => (
              <optgroup key={g} label={g}>
                {places
                  .filter((p) => (p.group ?? '장소') === g)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </Field>
      <Field label="날짜와 시간">
        <DayStrip days={days} value={d.day} name="day" max={maxDay} />
        <div className="mt-2">
          <input type="hidden" name="start" value={start} />
          <ChipGroup
            options={[...TIMES, '직접 입력']}
            defaultValue={custom ? '직접 입력' : d.start}
            onChange={(v) => {
              setCustom(v[0] === '직접 입력')
              if (v[0] !== '직접 입력') setStart(v[0])
            }}
          />
          {custom && (
            <TextInput
              type="time"
              aria-label="시작 시간"
              className="mt-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          )}
        </div>
      </Field>
      <Field label="인원">
        <div className="flex gap-2">
          <Stepper name="min" label="최소 (이만큼 모이면 성사)" value={d.min} min={2} max={6} />
          <Stepper name="max" label="최대" value={d.max} min={3} max={12} />
        </div>
      </Field>
      <Field label="한 줄 소개" htmlFor={`${id}-intro`}>
        <TextInput
          id={`${id}-intro`}
          name="intro"
          defaultValue={d.intro}
          placeholder="토요일 점심, 여섯 분 자리를 비워 둘게요"
          maxLength={80}
          required
        />
      </Field>
      <Field
        htmlFor={`${id}-cost`}
        label={
          <>
            예상 비용 <span className="font-normal text-muted">선택</span>
          </>
        }
      >
        <TextInput
          id={`${id}-cost`}
          name="cost"
          inputMode="numeric"
          defaultValue={d.cost}
          placeholder="1인 25000"
        />
      </Field>
    </form>
  )
}
