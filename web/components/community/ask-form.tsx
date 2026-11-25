'use client'

import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { writePostAction } from '@/app/actions/community'
import { ChipGroup, FieldLabel, TextArea, TextInput } from '@/components/forms/fields'
import { Icon } from '@/components/ui/icon'
import { Note } from '@/components/ui/primitives'
import { keep } from '@/lib/client/keep-form'

/** 질문 · 코스 공유 쓰기. 여행 후기를 고르면 후기 화면(체크인한 테마)으로 */
export function AskForm({
  id,
  places,
}: {
  id: string
  places: { id: string; name: string; area: string; group: string }[]
}) {
  const router = useRouter()
  const [state, send] = useActionState(writePostAction, undefined)
  const groups = [...new Set(places.map((p) => p.group))]
  return (
    <form id={id} onSubmit={keep(send)}>
      <h1 className="mt-4 mb-0 text-[22px] leading-[30px] font-extrabold tracking-[-0.04em]">
        무엇이 궁금한가요?
      </h1>
      <FieldLabel>종류</FieldLabel>
      <ChipGroup
        name="kind"
        options={['여행 후기', '코스 공유', '질문']}
        defaultValue="질문"
        onChange={(v) => v[0] === '여행 후기' && router.push('/community/write')}
      />
      <FieldLabel htmlFor={`${id}-title`}>제목</FieldLabel>
      <TextInput
        id={`${id}-title`}
        name="title"
        placeholder="운길산역에서 수종사까지 얼마나 걸리나요?"
        maxLength={60}
        required
      />
      <FieldLabel htmlFor={`${id}-body`}>내용</FieldLabel>
      <TextArea
        id={`${id}-body`}
        name="body"
        className="min-h-[140px]"
        placeholder="궁금한 점을 자세히 적어 주세요."
        required
      />
      <FieldLabel htmlFor={`${id}-place`} optional>
        관련 장소
      </FieldLabel>
      <div className="relative">
        <select
          id={`${id}-place`}
          name="place"
          defaultValue=""
          className="h-[50px] w-full appearance-none rounded-[14px] border-0 bg-face px-4 pr-10 text-[15px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-ink"
        >
          <option value="">고르지 않을게요</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {places
                .filter((p) => p.group === g)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.area}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <Icon
          name="chevron"
          size={14}
          weight={1.8}
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-muted"
        />
      </div>
      <Note className="mt-4">개인 연락처나 다른 사람의 얼굴이 담긴 사진은 올리지 말아 주세요.</Note>
      {state?.error && <div className="mt-3 text-[13px] text-warn">{state.error}</div>}
    </form>
  )
}
