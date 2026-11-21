'use client'

import { useActionState, useState } from 'react'
import { hostReviewAction } from '@/app/actions/c'
import { Avatar } from '@/components/ui/primitives'
import { keep } from '@/lib/client/keep-form'

const behavior = ['시간을 잘 지켜요', '변경 사항을 잘 알려줘요', '서로를 배려해요']

type Row = { id: string; name: string; checked: boolean; first?: boolean }

/** 호스트의 참여자 평가 — 행동 태그만 고른다(점수 없음). 체크인 기록이 없으면 참여 여부부터 */
export function HostReviewForm({ id, themeId, rows }: { id: string; themeId: string; rows: Row[] }) {
  const [state, send] = useActionState(hostReviewAction, undefined)
  const [sel, setSel] = useState<Record<string, string[]>>({})
  const toggle = (uid: string, tag: string) => {
    const cur = sel[uid] ?? []
    setSel({ ...sel, [uid]: cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag] })
  }
  const one = (uid: string, tag: string) => setSel({ ...sel, [uid]: [tag] })
  const pill = (on: boolean) =>
    `inline-flex h-11 items-center rounded-full border-0 px-4 text-[14px] ${on ? 'bg-ink font-semibold text-white' : 'bg-face font-medium text-label'}`
  return (
    <form id={id} onSubmit={keep(send)} className="mt-4">
      <input type="hidden" name="theme" value={themeId} />
      {rows.map((r) => (
        <div key={r.id} className="border-t border-line py-4">
          <input type="hidden" name="members" value={r.id} />
          {(sel[r.id] ?? []).map((tag) => (
            <input key={tag} type="hidden" name={r.checked ? `tag:${r.id}` : `att:${r.id}`} value={tag} />
          ))}
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
            {(r.checked ? behavior : ['불참 확인', '참여 확인']).map((tag) => {
              const on = (sel[r.id] ?? []).includes(tag)
              const label = r.checked ? tag : tag === '불참 확인' ? '불참했어요' : '참여했어요 (QR 오류)'
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  className={pill(on)}
                  onClick={() => (r.checked ? toggle(r.id, tag) : one(r.id, tag))}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {!rows.length && <div className="py-10 text-center text-[13px] text-sub">평가할 참여자가 없어요</div>}
      {state?.error && (
        <div className="mt-3 rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[13px] text-warn">
          {state.error}
        </div>
      )}
    </form>
  )
}
