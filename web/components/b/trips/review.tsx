'use client'

import { useState } from 'react'
import { Avatar, Chip } from '@/components/ui/primitives'
import { members, reviewTags } from '@/lib/demo/trips'

const others = members.filter((m) => !m.me)

/** 평가 고르기(사람별 태그 · 방문 질문). 디자인의 처음 선택 상태로 시작한다 */
export function ReviewForm() {
  const [tags, setTags] = useState<Record<string, string[]>>({
    harin: ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요'],
    yuna: ['서로를 배려해요'],
  })
  const [first, setFirst] = useState('처음이에요')
  const [without, setWithout] = useState('오지 않았을 거예요')
  const toggle = (id: string, tag: string) => {
    const cur = tags[id] ?? []
    setTags({ ...tags, [id]: cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag] })
  }
  return (
    <>
      <div className="mt-[18px]">
        {others.map((m) => (
          <fieldset key={m.id} className="m-0 border-0 border-t border-line p-0 py-[18px]">
            <legend className="sr-only">{m.name} 평가</legend>
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
    </>
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
