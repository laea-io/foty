'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { decideAction } from '@/app/actions/c'
import { Avatar, Badge, Tag } from '@/components/ui/primitives'
import type { applicantsOf } from '@/lib/server/q/c'

type A = Awaited<ReturnType<typeof applicantsOf>>[number]

/** 신청자 목록 — 대기 중인 사람을 수락·거절(정원은 서버에서 다시 센다). 거절 사유는 전하지 않는다 */
export function Applicants({
  themeId,
  list,
  min,
  current,
}: {
  themeId: string
  list: A[]
  min: number
  current: number
}) {
  const [state, send, pending] = useActionState(decideAction, undefined)
  const waiting = list.filter((a) => a.status === '신청 대기')
  const accepted = list.filter((a) => a.status === '수락')
  const first = waiting[0]
  return (
    <>
      <div className="mt-7 mb-1 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">신청자</h2>
        <span className="text-[12px] text-sub">
          대기 {waiting.length} · 수락 {accepted.length}
        </span>
      </div>
      {!list.length && (
        <div className="py-10 text-center text-[13px] text-sub">아직 신청한 사람이 없어요</div>
      )}
      {list.map((a) => (
        <div key={a.id} className="flex gap-3 border-t border-line py-4 first:border-t-0">
          <Link href={`/users/${a.handle}`} aria-label={`${a.name} 프로필`}>
            <Avatar name={a.name} size={40} />
          </Link>
          <div className="min-w-0 grow">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold">{a.name}</span>
              <Badge tone={a.status === '신청 대기' ? 'warn' : a.status === '수락' ? 'ink' : 'muted'}>
                {a.status}
              </Badge>
            </div>
            <div className="mt-0.5 text-[12px] text-sub">{a.from}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {a.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            {a.note && (
              <div className="mt-2.5 rounded-[12px] bg-face px-3.5 py-2.5 text-[13px] leading-5">
                {a.note}
              </div>
            )}
            {a.status === '신청 대기' && (
              <form action={send} className="mt-3 flex gap-2">
                <input type="hidden" name="theme" value={themeId} />
                <input type="hidden" name="application" value={a.id} />
                <button
                  type="submit"
                  name="accept"
                  value="1"
                  disabled={pending}
                  className="h-11 flex-1 rounded-[12px] border-0 bg-ink text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  수락
                </button>
                <button
                  type="submit"
                  name="accept"
                  value="0"
                  disabled={pending}
                  className="h-11 flex-1 rounded-[12px] border-0 bg-white text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--color-line-2)] disabled:opacity-40"
                >
                  거절
                </button>
              </form>
            )}
          </div>
        </div>
      ))}
      {state?.error && <div className="mt-2 text-[13px] text-warn">{state.error}</div>}
      <div className="mt-3 text-[12px] leading-[18px] text-muted" aria-live="polite">
        {first && current + first.party >= min && current < min
          ? `${first.name} 님을 수락하면 최소 인원 ${min}명이 채워져 성사돼요. 거절 사유는 신청자에게 전달되지 않아요.`
          : current >= min
            ? `최소 인원 ${min}명이 채워져 성사됐어요. 참여자에게 성사 알림이 갔어요.`
            : '거절 사유는 신청자에게 전달되지 않아요.'}
      </div>
    </>
  )
}
