'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/primitives'

const behavior = ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요', '서로를 배려해요']

type Row = { id: string; name: string; checked: boolean; first?: boolean }

/** 호스트의 참여자 평가 — 행동 태그만 고른다(점수 없음). 체크인 기록이 없으면 참여 여부부터 */
export function HostReviewForm({ rows }: { rows: Row[] }) {
  const [sel, setSel] = useState<Record<string, string[]>>({})
  const toggle = (id: string, tag: string) => {
    const cur = sel[id] ?? []
    setSel({ ...sel, [id]: cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag] })
  }
  const one = (id: string, tag: string) => setSel({ ...sel, [id]: [tag] })
  const pill = (on: boolean) =>
    `inline-flex h-11 items-center rounded-full border-0 px-4 text-[14px] ${on ? 'bg-ink font-semibold text-white' : 'bg-face font-medium text-label'}`
  return (
    <div className="mt-4">
      {rows.map((r) => (
        <div key={r.id} className="border-t border-line py-4">
          <div className="flex items-center gap-3">
            <Avatar name={r.name} size={40} />
            <div>
              <div className="text-[15px] font-bold">{r.name}</div>
              <div className={`text-[12px] ${r.checked ? 'text-sub' : 'text-warn'}`}>
                {r.checked ? `체크인 확인${r.first ? ' · 첫 동행' : ''}` : '체크인 기록이 없어요'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(r.checked ? behavior : ['불참했어요', '참여했어요 (QR 오류)']).map((tag) => {
              const on = (sel[r.id] ?? []).includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  className={pill(on)}
                  onClick={() => (r.checked ? toggle(r.id, tag) : one(r.id, tag))}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
