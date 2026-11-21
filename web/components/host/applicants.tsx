'use client'

import { useState } from 'react'
import { Avatar, Badge, Tag } from '@/components/ui/primitives'
import { applicants } from '@/lib/demo/host'

type Status = '신청 대기' | '수락' | '거절'

/** 신청자 목록 — 대기 중인 사람을 수락·거절할 수 있다(시연: 화면 상태만) */
export function Applicants({ min }: { min: number }) {
  const [st, setSt] = useState<Record<string, Status>>(
    Object.fromEntries(applicants.map((a) => [a.id, a.status])),
  )
  const waiting = Object.values(st).filter((s) => s === '신청 대기').length
  const accepted = Object.values(st).filter((s) => s === '수락').length
  const pending = applicants.find((a) => st[a.id] === '신청 대기')
  return (
    <>
      <div className="mt-7 mb-1 flex items-baseline justify-between">
        <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.04em]">신청자</h2>
        <span className="text-[12px] text-sub">
          대기 {waiting} · 수락 {accepted}
        </span>
      </div>
      {applicants.map((a) => {
        const s = st[a.id]
        return (
          <div key={a.id} className="flex gap-3 border-t border-line py-4 first:border-t-0">
            <Avatar name={a.name} size={40} />
            <div className="min-w-0 grow">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold">{a.name}</span>
                <Badge tone={s === '신청 대기' ? 'warn' : s === '수락' ? 'ink' : 'muted'}>{s}</Badge>
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
              {s === '신청 대기' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSt({ ...st, [a.id]: '수락' })}
                    className="h-11 flex-1 rounded-[12px] border-0 bg-ink text-[13px] font-semibold text-white"
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    onClick={() => setSt({ ...st, [a.id]: '거절' })}
                    className="h-11 flex-1 rounded-[12px] border-0 bg-white text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--color-line-2)]"
                  >
                    거절
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div className="mt-3 text-[12px] leading-[18px] text-muted" aria-live="polite">
        {pending
          ? `${pending.name} 님을 수락하면 최소 인원 ${min}명이 채워져 성사돼요. 거절 사유는 신청자에게 전달되지 않아요.`
          : accepted >= min
            ? `최소 인원 ${min}명이 채워져 성사됐어요. 참여자에게 성사 알림이 가요.`
            : '거절 사유는 신청자에게 전달되지 않아요.'}
      </div>
    </>
  )
}
