'use client'

// 홈 조건의 날짜·출발지 고르기 — 데스크톱 "조건" 패널과 조건 시트(/filter)가 같이 쓴다.
import { useState } from 'react'
import { Chip } from '@/components/ui/primitives'
import type { HomeQuery } from '@/lib/shared/filters'
import { DEFAULT_ORIGIN, MY_LOCATION, STATIONS } from '@/lib/shared/stations'

export type UpcomingDate = { iso: string; label: string; count: number }

const POPULAR = ['상봉역', '청량리역', '잠실역', '구리역', '강남역', '서울역']

/** 이번 주말 · 다음 주말 · 전체 + 테마가 있는 날짜 + 달력에서 직접 고르기 */
export function DateChoices({
  q,
  set,
  dates,
  max = 8,
}: {
  q: HomeQuery
  set: (patch: Partial<HomeQuery>) => void
  dates: UpcomingDate[]
  max?: number
}) {
  const [more, setMore] = useState(false)
  const shown = more ? dates : dates.slice(0, max)
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10)
  const last = dates.at(-1)?.iso
  return (
    <>
      <Chip
        selected={!q.day && q.view === 'weekend'}
        onClick={() => set({ view: 'weekend', day: undefined })}
      >
        이번 주말
      </Chip>
      <Chip selected={!q.day && q.view === 'next'} onClick={() => set({ view: 'next', day: undefined })}>
        다음 주말
      </Chip>
      <Chip selected={!q.day && q.view === 'all'} onClick={() => set({ view: 'all', day: undefined })}>
        전체 날짜
      </Chip>
      {shown.map((d) => (
        <Chip
          key={d.iso}
          selected={q.day === d.iso}
          onClick={() => set({ day: q.day === d.iso ? undefined : d.iso, view: 'all' })}
        >
          {d.label} <span className="ml-1 text-[12px] opacity-60">{d.count}</span>
        </Chip>
      ))}
      {dates.length > max && !more && <Chip onClick={() => setMore(true)}>날짜 더 보기</Chip>}
      <label className="mt-0.5 flex h-11 w-full items-center gap-2 rounded-[12px] bg-face px-4 text-[14px] text-sub">
        <span className="flex-none">날짜 고르기</span>
        <input
          type="date"
          min={today}
          max={last && last > today ? last : undefined}
          value={q.day ?? ''}
          onChange={(e) => set({ day: e.target.value || undefined, view: 'all' })}
          className="min-w-0 grow border-0 bg-transparent text-right text-[15px] text-ink outline-none"
          aria-label="날짜 고르기"
        />
      </label>
    </>
  )
}

/** 자주 쓰는 역 + 내 위치 + 역 이름 찾기(서울·경기 44개 역) */
export function OriginChoices({ q, set }: { q: HomeQuery; set: (patch: Partial<HomeQuery>) => void }) {
  const origin = q.origin ?? DEFAULT_ORIGIN
  const [text, setText] = useState('')
  const [locating, setLocating] = useState<'' | 'wait' | 'fail'>('')
  const chips = POPULAR.includes(origin) || origin === MY_LOCATION ? POPULAR : [origin, ...POPULAR]
  const locate = () => {
    if (!navigator.geolocation) return setLocating('fail')
    setLocating('wait')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating('')
        set({ origin: MY_LOCATION, at: `${p.coords.latitude.toFixed(4)},${p.coords.longitude.toFixed(4)}` })
      },
      () => setLocating('fail'),
      { timeout: 8000, maximumAge: 600000 },
    )
  }
  const pick = (v: string) => {
    setText(v)
    const st = STATIONS.find((s) => s.name === v || s.name === `${v}역`)
    if (st) {
      set({ origin: st.name, at: undefined })
      setText('')
    }
  }
  return (
    <>
      <Chip selected={origin === MY_LOCATION} icon="pin" onClick={locate}>
        {locating === 'wait' ? '위치 찾는 중…' : MY_LOCATION}
      </Chip>
      {chips.map((o) => (
        <Chip key={o} selected={origin === o} onClick={() => set({ origin: o, at: undefined })}>
          {o}
        </Chip>
      ))}
      <input
        aria-label="출발역 찾기"
        list="foty-stations"
        value={text}
        onChange={(e) => pick(e.target.value.trim())}
        placeholder="다른 역 찾기 (예: 왕십리)"
        className="mt-0.5 h-11 w-full rounded-[12px] border-0 bg-face px-4 text-[15px] text-ink outline-none placeholder:text-muted"
      />
      <datalist id="foty-stations">
        {STATIONS.map((s) => (
          <option key={s.name} value={s.name} />
        ))}
      </datalist>
      {locating === 'fail' && (
        <p className="m-0 w-full text-[12px] text-warn">위치를 가져오지 못했어요. 역을 골라 주세요.</p>
      )}
      <p className="m-0 w-full text-[12px] text-muted">이동 시간은 직선거리로 어림한 값이에요.</p>
    </>
  )
}
