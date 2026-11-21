'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Button, Chip } from '@/components/ui/primitives'
import { filterThemes, type HomeQuery, parseQuery, toSearch } from '@/lib/demo/filters'
import { activityList, budgets, origins, week } from '@/lib/demo/themes'

/**
 * 조건 입력(어떤 테마를 찾으세요?). 홈과 같은 주소 쿼리를 읽고 쓴다 —
 * “테마 n개 보기”를 누르면 고른 조건을 붙여 홈(/)으로 간다. 닫으면 원래 조건 그대로.
 */
export function FilterSheet({ q }: { q: HomeQuery }) {
  const close = `/${toSearch(q)}`
  return (
    <>
      <div className="fixed inset-0 z-40 lg:hidden">
        <Link
          href={close}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 bg-[rgba(27,29,36,0.4)]"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="어떤 테마를 찾으세요?"
          className="absolute inset-x-0 top-10 bottom-0 mx-auto flex max-w-[560px] flex-col rounded-t-[20px] bg-white"
        >
          <i className="mx-auto mt-2.5 block h-1 w-9 flex-none rounded-[2px] bg-line" />
          <FilterForm q={q} close={close} />
        </div>
      </div>
      <div className="fixed inset-0 z-40 hidden items-start justify-center pt-[100px] lg:flex">
        <Link
          href={close}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 bg-[rgba(27,29,36,0.4)]"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="어떤 테마를 찾으세요?"
          className="relative flex max-h-[calc(100vh-160px)] w-[520px] flex-col rounded-[20px] bg-white pt-2"
        >
          <FilterForm q={q} close={close} wide />
        </div>
      </div>
    </>
  )
}

function FilterForm({ q, close, wide }: { q: HomeQuery; close: string; wide?: boolean }) {
  const router = useRouter()
  const [d, setD] = useState<HomeQuery>(q)
  const [custom, setCustom] = useState(!!q.origin && !origins.includes(q.origin))
  const set = (patch: Partial<HomeQuery>) => setD((prev) => ({ ...prev, ...patch }))
  const acts = d.act ? d.act.split(',') : []
  const toggleAct = (a: string) => {
    const next = acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a]
    set({ act: next.length ? next.join(',') : undefined })
  }
  const count = filterThemes(d).length
  const reset = () => {
    setD(parseQuery({}))
    setCustom(false)
  }

  return (
    <>
      <div
        className={`flex flex-none items-center justify-between pt-2.5 pr-2 pb-1.5 ${wide ? 'pl-7' : 'pl-5'}`}
      >
        <h2 className="m-0 text-[18px] font-bold tracking-[-0.03em]">어떤 테마를 찾으세요?</h2>
        <Link href={close} aria-label="닫기" className="flex h-11 w-11 items-center justify-center">
          <Icon name="close" />
        </Link>
      </div>
      <div
        className={`flex min-h-0 grow flex-col gap-[22px] overflow-y-auto pt-1.5 pb-2 ${wide ? 'px-7' : 'px-5'}`}
      >
        <Group title="날짜">
          {week.slice(0, 2).map((w) => (
            <Chip
              key={w.day}
              selected={d.view !== 'next' && d.day === String(w.day)}
              onClick={() =>
                set({ day: d.day === String(w.day) ? undefined : String(w.day), view: 'weekend' })
              }
            >
              {w.date}
            </Chip>
          ))}
          <Chip
            selected={d.view === 'next'}
            onClick={() => set({ view: d.view === 'next' ? 'weekend' : 'next', day: undefined })}
          >
            다음 주말
          </Chip>
        </Group>
        <Group title="출발지">
          {origins.map((o) => (
            <Chip
              key={o}
              selected={!custom && d.origin === o}
              onClick={() => {
                setCustom(false)
                set({ origin: o })
              }}
            >
              {o}
            </Chip>
          ))}
          <Chip selected={custom} onClick={() => setCustom(true)}>
            직접 입력
          </Chip>
          {custom && (
            <input
              aria-label="출발지 직접 입력"
              // biome-ignore lint/a11y/noAutofocus: 직접 입력을 누른 직후에만 나타나는 칸
              autoFocus
              value={origins.includes(d.origin ?? '') ? '' : (d.origin ?? '')}
              onChange={(e) => set({ origin: e.target.value || '상봉역' })}
              placeholder="예: 왕십리역"
              className="mt-0.5 h-11 w-full rounded-[12px] border-0 bg-face px-4 text-[15px] text-ink outline-none placeholder:text-muted"
            />
          )}
        </Group>
        <Group title="이동수단">
          <Chip selected={d.transit === '1'} onClick={() => set({ transit: '1' })}>
            대중교통으로 가능한 테마
          </Chip>
          <Chip selected={d.transit === '0'} onClick={() => set({ transit: '0' })}>
            자차
          </Chip>
        </Group>
        <Group title="활동">
          {activityList.map((a) => (
            <Chip key={a} selected={acts.includes(a)} onClick={() => toggleAct(a)}>
              {a}
            </Chip>
          ))}
        </Group>
        <Group title="예산">
          {budgets.map((b) => (
            <Chip
              key={b}
              selected={d.budget === b || (b === '상관없음' && !d.budget)}
              onClick={() => set({ budget: b === '상관없음' ? undefined : b })}
            >
              {b}
            </Chip>
          ))}
        </Group>
      </div>
      <div
        className={`flex flex-none items-center gap-2.5 pt-3 ${wide ? 'px-7 pb-7' : 'px-5'}`}
        style={wide ? undefined : { paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
      >
        <Button variant="outline" size="lg" onClick={reset}>
          초기화
        </Button>
        <div className="grow">
          <Button size="lg" block onClick={() => router.push(`/${toSearch(d)}`)}>
            테마 {count}개 보기
          </Button>
        </div>
      </div>
    </>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-[13px] font-semibold">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
