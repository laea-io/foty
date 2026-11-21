'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { reviewAction } from '@/app/actions/b-trips'
import { BottomBar } from '@/components/shell/mobile'
import { Avatar, Button, buttonClass, Chip } from '@/components/ui/primitives'

/** 평가 태그(rules.behaviorTags와 같다 — 점수 없음) */
const reviewTags = ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요', '서로를 배려해요']

type Person = { id: string; name: string; host: boolean; tags: string[] }

/** 평가 고르기(사람별 행동 태그 · 방문 질문). 전에 낸 평가가 있으면 그 상태로 시작한다 */
export function ReviewForm({
  themeId,
  people,
  firstVisit,
  deadline,
}: {
  themeId: string
  people: Person[]
  firstVisit: boolean | null
  deadline: string
}) {
  const [tags, setTags] = useState<Record<string, string[]>>(
    Object.fromEntries(people.map((p) => [p.id, p.tags])),
  )
  const [first, setFirst] = useState(
    firstVisit === true ? '처음이에요' : firstVisit === false ? '와본 적 있어요' : '',
  )
  const [without, setWithout] = useState('')
  const [state, action, pending] = useActionState(reviewAction, undefined)
  const toggle = (id: string, tag: string) => {
    const cur = tags[id] ?? []
    setTags({ ...tags, [id]: cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag] })
  }
  const buttons = (
    <>
      <Link href={`/report?theme=${themeId}`} className={buttonClass('outline', 'lg')}>
        신고하기
      </Link>
      <div className="grow">
        {state?.error && <div className="mb-2 text-[13px] text-warn">{state.error}</div>}
        <Button type="submit" size="lg" block disabled={pending}>
          평가 보내기
        </Button>
      </div>
    </>
  )
  return (
    <form action={action}>
      <input type="hidden" name="themeId" value={themeId} />
      <div className="mt-[18px]">
        {people.map((m) => (
          <fieldset key={m.id} className="m-0 border-0 border-t border-line p-0 py-[18px]">
            <legend className="sr-only">{m.name} 평가</legend>
            <input type="hidden" name="person" value={m.id} />
            {(tags[m.id] ?? []).map((tag) => (
              <input key={tag} type="hidden" name={`tag:${m.id}`} value={tag} />
            ))}
            <div className="mb-3 flex items-center gap-2.5">
              <Avatar name={m.name} size={36} />
              <div>
                <div className="text-[15px] font-bold">{m.name}</div>
                <div className="text-[12px] text-sub">{m.host ? '호스트' : '참여자'}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reviewTags.map((tag) => (
                <Chip key={tag} selected={(tags[m.id] ?? []).includes(tag)} onClick={() => toggle(m.id, tag)}>
                  {tag}
                </Chip>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <input type="hidden" name="firstVisit" value={first} />
      <Question
        title="남양주는 이번이 처음이었나요?"
        options={['처음이에요', '와본 적 있어요']}
        value={first}
        onChange={setFirst}
      />
      <Question
        title="이 테마가 없었어도 남양주에 왔을까요?"
        options={['왔을 거예요', '오지 않았을 거예요', '잘 모르겠어요']}
        value={without}
        onChange={setWithout}
      />
      <div className="mt-4 text-[12px] text-muted">평가는 {deadline}까지 남기거나 고칠 수 있어요.</div>
      <div className="mt-8 hidden items-center gap-2.5 lg:flex">{buttons}</div>
      <div className="h-[100px] lg:hidden" />
      <BottomBar>{buttons}</BottomBar>
    </form>
  )
}

function Question({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mt-[26px] mb-2.5 p-0 text-[14px] font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o} selected={value === o} onClick={() => onChange(value === o ? '' : o)}>
            {o}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}
