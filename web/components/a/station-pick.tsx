'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Chip } from '@/components/ui/primitives'

/**
 * 출발역 고르기 — 자주 쓰는 역 칩 + 전체 역 검색(datalist). 고른 역 이름이 그대로 users.origin에 저장돼
 * 홈 조건의 기본 출발지(defaultOrigin)와 맞는다.
 */
export function StationPick({
  id,
  name,
  stations,
  common,
  initial,
}: {
  id: string
  name: string
  /** 고를 수 있는 모든 역 이름 */
  stations: string[]
  /** 칩으로 보여 줄 자주 쓰는 역 */
  common: string[]
  initial?: string
}) {
  const [value, setValue] = useState(initial ?? '')
  return (
    <div>
      {/* biome-ignore lint/a11y/useSemanticElements: 칩 묶음 — fieldset 기본 모양을 피한다 */}
      <div role="group" aria-label="자주 쓰는 출발역" className="flex flex-wrap gap-1.5">
        {common.map((s) => (
          <Chip key={s} selected={value === s} onClick={() => setValue(s)}>
            {s}
          </Chip>
        ))}
      </div>
      <label htmlFor={id} className="mt-3 flex h-[50px] items-center gap-2.5 rounded-[14px] bg-face px-4">
        <Icon name="search" size={18} className="text-muted" />
        <span className="sr-only">다른 역 찾기</span>
        <input
          id={id}
          name={name}
          list={`${id}-list`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="다른 역 찾기 (예: 노원역)"
          autoComplete="off"
          maxLength={20}
          className="h-full grow border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      <datalist id={`${id}-list`}>
        {stations.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {value && !stations.includes(value) && !stations.includes(`${value}역`) && (
        <div className="mt-2 text-[12px] text-warn">목록에 있는 역 이름으로 골라 주세요</div>
      )}
    </div>
  )
}
