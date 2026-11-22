'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState, useTransition } from 'react'
import { countThemesAction } from '@/app/actions/b-themes'
import { DateChoices, OriginChoices, type UpcomingDate } from '@/components/home/conditions'
import { Icon } from '@/components/ui/icon'
import { Button, Chip } from '@/components/ui/primitives'
import { type HomeQuery, parseQuery, toSearch } from '@/lib/demo/filters'
import { activityList, budgets } from '@/lib/demo/themes'

/**
 * 조건 입력(어떤 테마를 찾으세요?). 홈과 같은 주소 쿼리를 읽고 쓴다 —
 * “테마 n개 보기”를 누르면 고른 조건을 붙여 홈(/)으로 간다. 닫으면 원래 조건 그대로.
 */
export function FilterSheet({ q, dates, count }: { q: HomeQuery; dates: UpcomingDate[]; count: number }) {
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
          <FilterForm q={q} close={close} dates={dates} initial={count} />
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
          <FilterForm q={q} close={close} dates={dates} initial={count} wide />
        </div>
      </div>
    </>
  )
}

function FilterForm({
  q,
  close,
  dates,
  initial,
  wide,
}: {
  q: HomeQuery
  close: string
  dates: UpcomingDate[]
  initial: number
  wide?: boolean
}) {
  const router = useRouter()
  const [d, setD] = useState<HomeQuery>(q)
  const set = (patch: Partial<HomeQuery>) => setD((prev) => ({ ...prev, ...patch }))
  const acts = d.act ? d.act.split(',') : []
  const toggleAct = (a: string) => {
    const next = acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a]
    set({ act: next.length ? next.join(',') : undefined })
  }
  // 고른 조건의 테마 수는 서버에 묻는다(DB)
  const [count, setCount] = useState(initial)
  const [, start] = useTransition()
  const key = toSearch(d)
  useEffect(() => {
    let live = true
    start(async () => {
      const n = await countThemesAction(parseQuery(Object.fromEntries(new URLSearchParams(key))))
      if (live) setCount(n)
    })
    return () => {
      live = false
    }
  }, [key])
  const reset = () => {
    setD(parseQuery({}))
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
          <DateChoices q={d} set={set} dates={dates} />
        </Group>
        <Group title="출발지">
          <OriginChoices q={d} set={set} />
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
