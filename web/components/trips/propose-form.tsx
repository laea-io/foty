'use client'

import Link from 'next/link'
import { useActionState, useId, useState } from 'react'
import { proposeChangeAction } from '@/app/actions/trips'
import { ChipGroup, TextInput } from '@/components/forms/fields'
import { Button } from '@/components/ui/primitives'
import { keep } from '@/lib/client/keep-form'

const KINDS = [
  ['date', '날짜'],
  ['meet_time', '집결 시간'],
  ['meet_place', '집결 장소'],
  ['budget', '예산'],
] as const

/** 주요 변경 제안 — 그룹 모두가 확인하면 반영된다 */
export function ProposeForm({
  themeId,
  day,
  cost,
  meet,
}: {
  themeId: string
  day: string
  cost: string
  meet: string
}) {
  const id = useId()
  const [kind, setKind] = useState<(typeof KINDS)[number][0]>('date')
  const [state, send, pending] = useActionState(proposeChangeAction, undefined)
  const now: Record<string, string> = {
    date: day,
    budget: cost,
    meet_time: meet || '아직 정하지 않음',
    meet_place: meet || '아직 정하지 않음',
  }
  if (state?.done)
    return (
      <div className="mt-6 rounded-[16px] bg-face px-4 py-4 text-[14px] leading-6">
        제안을 올렸어요. 그룹 모두가 확인하면 일정에 반영되고 알림이 가요.
        <div className="mt-3 flex gap-3">
          <Link href={`/trips/${themeId}`} className="font-semibold text-ink">
            일정으로
          </Link>
          <Link href={`/trips/${themeId}/history`} className="text-sub">
            변경 이력
          </Link>
        </div>
      </div>
    )
  return (
    <form onSubmit={keep(send)} className="mt-5">
      <input type="hidden" name="theme" value={themeId} />
      <input type="hidden" name="kind" value={kind} />
      <div className="mb-2 text-[13px] font-semibold">무엇을 바꿀까요?</div>
      <ChipGroup
        options={KINDS.map(([, l]) => l)}
        defaultValue="날짜"
        onChange={(v) => setKind(KINDS.find(([, l]) => l === v[0])?.[0] ?? 'date')}
      />
      <div className="mt-4 text-[13px] text-sub">지금: {now[kind]}</div>
      <label htmlFor={`${id}-to`} className="mt-3 mb-2 block text-[13px] font-semibold">
        바꿀 내용
      </label>
      {kind === 'date' ? (
        <TextInput id={`${id}-to`} key="date" name="to" type="date" required />
      ) : kind === 'budget' ? (
        <TextInput
          id={`${id}-to`}
          key="budget"
          name="to"
          inputMode="numeric"
          placeholder="1인 20000"
          required
        />
      ) : (
        <TextInput
          id={`${id}-to`}
          key={kind}
          name="to"
          maxLength={80}
          placeholder={kind === 'meet_time' ? '예: 10:30으로 30분 늦춰요' : '예: 운길산역 2번 출구'}
          required
        />
      )}
      {state?.error && <div className="mt-3 text-[13px] text-warn">{state.error}</div>}
      <Button type="submit" size="lg" block className="mt-6" disabled={pending}>
        {pending ? '올리는 중…' : '제안 올리기'}
      </Button>
      <p className="mt-3 text-center text-[12px] text-muted">
        주요 변경이라 호스트와 참여자 모두가 확인해야 반영돼요.
      </p>
    </form>
  )
}
