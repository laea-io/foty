'use client'

import { type FormEvent, Fragment, type ReactNode, useEffect, useRef, useState, useTransition } from 'react'
import { sendChatAction } from '@/app/actions/b-trips'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/primitives'
import type { ChatMsg } from './types'

/**
 * 그룹 대화. 처음 글은 서버가 넘기고, 새 글은 SSE(/api/trips/[id]/stream)로 받는다.
 * 스트림이 LISTEN을 못 하면(fallback) 4초마다 ?once=1로 묻는다. 같은 글은 id로 거른다.
 * card(변경 확인 카드)는 처음 받은 대화 뒤(디자인 자리)에 — 새로 오는 글은 그 아래로.
 */
export function ChatThread({
  themeId,
  initial,
  card,
  wide,
}: {
  themeId: string
  initial: ChatMsg[]
  card: ReactNode
  wide?: boolean
}) {
  const [list, setList] = useState<ChatMsg[]>(initial)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const end = useRef<HTMLDivElement>(null)
  // 따라잡기 기준 시각 — 시각이 미래인 글(시연 데이터)이 있어도 지금을 넘기지 않는다
  const cap = (at: string) => {
    const now = new Date().toISOString()
    return at < now ? at : now
  }
  const last = useRef(cap(initial[initial.length - 1]?.at ?? new Date().toISOString()))
  const count = list.length

  const add = (msgs: ChatMsg[]) =>
    setList((prev) => {
      const seen = new Set(prev.map((m) => m.id))
      const fresh = msgs.filter((m) => !seen.has(m.id))
      if (!fresh.length) return prev
      for (const m of fresh) if (cap(m.at) > last.current) last.current = cap(m.at)
      // 온 순서대로 아래에 붙인다
      return [...prev, ...fresh]
    })

  useEffect(() => {
    if (count > initial.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [count, initial.length])

  // 실시간: SSE → 안 되면 몇 초마다 묻기
  // biome-ignore lint/correctness/useExhaustiveDependencies: add는 setList만 쓴다
  useEffect(() => {
    let es: EventSource | null = null
    let poll: ReturnType<typeof setInterval> | null = null
    const startPoll = () => {
      if (poll) return
      es?.close()
      poll = setInterval(async () => {
        try {
          const r = await fetch(
            `/api/trips/${themeId}/stream?once=1&since=${encodeURIComponent(last.current)}`,
            { cache: 'no-store' },
          )
          if (r.ok) add((await r.json()) as ChatMsg[])
        } catch {
          /* 다음에 다시 */
        }
      }, 4000)
    }
    if (typeof EventSource === 'undefined') startPoll()
    else {
      es = new EventSource(`/api/trips/${themeId}/stream?since=${encodeURIComponent(last.current)}`)
      es.onmessage = (e) => {
        try {
          add([JSON.parse(e.data) as ChatMsg])
        } catch {
          /* 깨진 줄은 건너뛴다 */
        }
      }
      es.addEventListener('fallback', startPoll)
    }
    return () => {
      es?.close()
      if (poll) clearInterval(poll)
    }
  }, [themeId])

  const send = (e: FormEvent) => {
    e.preventDefault()
    const v = text.trim()
    if (!v || pending) return
    start(async () => {
      const r = await sendChatAction({ themeId, body: v })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setError('')
      setText('')
      if (r.data) add([r.data])
    })
  }

  const inputId = wide ? 'chat-w' : 'chat-m'
  const at = card ? initial.length : -1

  const bar = (
    <>
      {error && <div className="mb-2 text-[13px] text-warn">{error}</div>}
      <form onSubmit={send} className="flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          메시지
        </label>
        <input
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지 보내기"
          autoComplete="off"
          maxLength={1000}
          className={`min-w-0 grow rounded-full border-0 bg-face text-ink outline-none placeholder:text-muted ${
            wide ? 'h-12 px-[18px] text-[15px]' : 'h-11 px-4 text-[14px]'
          }`}
        />
        <button
          type="submit"
          aria-label="보내기"
          disabled={pending}
          className="flex h-11 w-11 flex-none items-center justify-center border-0 bg-transparent p-0 disabled:opacity-40"
        >
          <Icon name="send" />
        </button>
      </form>
    </>
  )

  const items = list.map((m, i) => (
    <Fragment key={m.id}>
      {(i === 0 || list[i - 1].day !== m.day) && (
        <div className={`text-center text-muted ${wide ? 'text-[12px]' : 'text-[11px]'}`}>{m.day}</div>
      )}
      {i === at && card && <div className={wide ? 'max-w-[420px]' : ''}>{card}</div>}
      <Bubble m={m} wide={wide} />
    </Fragment>
  ))
  const tail = at === list.length && card ? <div className={wide ? 'max-w-[420px]' : ''}>{card}</div> : null

  if (wide)
    return (
      <div className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <div className="flex min-h-[420px] flex-col gap-[18px]">
          {items}
          {tail}
          <div ref={end} />
        </div>
        <div className="mt-6 border-t border-line pt-4">{bar}</div>
      </div>
    )

  return (
    <>
      <div className="flex flex-col gap-4 pt-[18px]">
        {items}
        {tail}
        <div ref={end} />
      </div>
      <div
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[560px] border-t border-line bg-white px-3 pt-2.5 lg:hidden"
        style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
      >
        {bar}
      </div>
    </>
  )
}

function Bubble({ m, wide }: { m: ChatMsg; wide?: boolean }) {
  const pad = wide ? 'px-4 py-[11px]' : 'px-3.5 py-2.5'
  const time = (
    <span className={`flex-none text-muted ${wide ? 'text-[11px]' : 'text-[10px]'}`}>{m.time}</span>
  )
  // 시스템 안내: 날짜 줄과 같은 가운데 회색 글자
  if (m.system)
    return (
      <div
        className={`mx-auto max-w-[320px] whitespace-pre-line text-center leading-[18px] text-muted ${
          wide ? 'text-[12px]' : 'text-[11px]'
        }`}
      >
        {m.text}
      </div>
    )
  if (m.mine)
    return (
      <div className="flex items-end justify-end gap-1.5">
        {time}
        <div
          className={`whitespace-pre-line rounded-[16px_16px_4px_16px] bg-ink text-[15px] leading-[22px] text-white ${pad} ${
            wide ? 'max-w-[420px]' : 'max-w-[250px]'
          }`}
        >
          {m.text}
        </div>
      </div>
    )
  const who = m.role ? `${m.from} · ${m.role}` : m.from
  return (
    <div className={`flex ${wide ? 'max-w-[520px] gap-2.5' : 'max-w-[310px] gap-2'}`}>
      {wide && m.role && <Avatar name={who} size={38} />}
      <div>
        <div className="mb-1 text-[12px] text-sub">{who}</div>
        <div className="flex items-end gap-1.5">
          <div
            className={`whitespace-pre-line rounded-[4px_16px_16px_16px] bg-face text-[15px] leading-[22px] ${pad}`}
          >
            {m.text}
          </div>
          {time}
        </div>
      </div>
    </div>
  )
}
