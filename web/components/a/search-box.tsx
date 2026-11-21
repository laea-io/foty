'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'

/** 검색 입력칸 — 입력하면 주소(?q=)가 바뀌어 결과가 다시 그려진다 */
export function SearchBox({ q }: { q: string }) {
  const router = useRouter()
  const [v, setV] = useState(q)
  const pushed = useRef(q)
  // 바깥에서 주소가 바뀌면(추천 검색어 등) 입력칸도 따라간다. 내가 보낸 값이면 그대로 둔다.
  useEffect(() => {
    if (q !== pushed.current) {
      pushed.current = q
      setV(q)
    }
  }, [q])
  const go = (next: string) => {
    pushed.current = next
    router.replace(`/search?q=${encodeURIComponent(next)}`, { scroll: false })
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        go(v.trim())
      }}
      className="mt-2 flex h-[50px] items-center gap-2.5 rounded-[14px] bg-face px-4"
    >
      <Icon name="search" size={18} weight={1.8} />
      <input
        type="search"
        name="q"
        value={v}
        onChange={(e) => {
          setV(e.target.value)
          go(e.target.value)
        }}
        placeholder="테마·장소 검색"
        aria-label="검색어"
        className="min-w-0 grow border-0 bg-transparent p-0 text-[15px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {v && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => {
            setV('')
            go('')
          }}
          className="flex h-6 w-6 items-center justify-center border-0 bg-transparent p-0"
        >
          <Icon name="close" size={16} weight={1.8} className="text-muted" />
        </button>
      )}
    </form>
  )
}
