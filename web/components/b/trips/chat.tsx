'use client'

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/primitives'
import { type ChatMessage, chat, chatDay } from '@/lib/demo/chat'

const now = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 그룹 대화. 보낸 말은 이 화면에만 남는다(시연) */
export function ChatThread({ card, wide }: { card: ReactNode; wide?: boolean }) {
  const [list, setList] = useState<ChatMessage[]>(chat)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const count = list.length
  useEffect(() => {
    if (count > chat.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [count])

  const send = (e: FormEvent) => {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    setList([...list, { id: `me-${list.length}`, from: 'me', text: v, time: now() }])
    setText('')
  }

  const first = list.slice(0, chat.length)
  const added = list.slice(chat.length)
  const inputId = wide ? 'chat-w' : 'chat-m'

  const bar = (
    <form onSubmit={send} className="flex items-center gap-2">
      <button
        type="button"
        aria-label="첨부"
        className="flex h-11 w-11 flex-none items-center justify-center border-0 bg-transparent p-0"
      >
        <Icon name="plus" />
      </button>
      <label htmlFor={inputId} className="sr-only">
        메시지
      </label>
      <input
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메시지 보내기"
        autoComplete="off"
        className={`min-w-0 grow rounded-full border-0 bg-face text-ink outline-none placeholder:text-muted ${
          wide ? 'h-12 px-[18px] text-[15px]' : 'h-11 px-4 text-[14px]'
        }`}
      />
      <button
        type="submit"
        aria-label="보내기"
        className="flex h-11 w-11 flex-none items-center justify-center border-0 bg-transparent p-0"
      >
        <Icon name="send" />
      </button>
    </form>
  )

  const bubbles = (msgs: ChatMessage[]) => msgs.map((m) => <Bubble key={m.id} m={m} wide={wide} />)

  if (wide)
    return (
      <div className="rounded-[20px] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <div className="flex min-h-[420px] flex-col gap-[18px]">
          <div className="text-center text-[12px] text-muted">{chatDay}</div>
          {bubbles(first)}
          <div className="max-w-[420px]">{card}</div>
          {bubbles(added)}
          <div ref={end} />
        </div>
        <div className="mt-6 border-t border-line pt-4">{bar}</div>
      </div>
    )

  return (
    <>
      <div className="flex flex-col gap-4 pt-[18px]">
        <div className="text-center text-[11px] text-muted">{chatDay}</div>
        {bubbles(first)}
        {card}
        {bubbles(added)}
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

function Bubble({ m, wide }: { m: ChatMessage; wide?: boolean }) {
  const pad = wide ? 'px-4 py-[11px]' : 'px-3.5 py-2.5'
  const time = (
    <span className={`flex-none text-muted ${wide ? 'text-[11px]' : 'text-[10px]'}`}>{m.time}</span>
  )
  if (m.from === 'me')
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
      {wide && m.avatar && <Avatar name={who} size={38} />}
      <div>
        <div className="mb-1 text-[12px] text-sub">{who}</div>
        <div className="flex items-end gap-1.5">
          <div
            className={`whitespace-pre-line rounded-[4px_16px_16px_16px] bg-face text-[15px] leading-[22px] ${pad}`}
          >
            {wide ? (m.wideText ?? m.text) : m.text}
          </div>
          {time}
        </div>
      </div>
    </div>
  )
}
