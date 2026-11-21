'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DesktopFrame, MobileFrame, MobileTopBar } from '@/components/shell/mobile'
import { ThemeRow, ThemeTile } from '@/components/theme/cards'
import { NoThemes } from '@/components/theme/empty'
import { Icon } from '@/components/ui/icon'
import { Button, Chip, DemoNote, Photo, Reason, TextTabs } from '@/components/ui/primitives'
import { type HomeQuery, toSearch } from '@/lib/demo/filters'
import { activityList, budgets, img, origins, type Theme } from '@/lib/demo/themes'

/** 달력 한 칸(weekStrip) */
export type Day = { day: number; dow: string; date: string; iso: string }

const tabsFor = (q: HomeQuery) => [
  { href: `/${toSearch({ ...q, view: 'weekend' })}`, label: '이번 주말 테마' },
  { href: `/${toSearch({ ...q, view: 'next', day: undefined })}`, label: '다음 주' },
  { href: `/${toSearch({ ...q, view: 'all', day: undefined })}`, label: '전체' },
]

/** 홈 · 조건 결과. 목록과 달력은 서버(homeData)가 DB에서 읽어 넘긴다 */
export function HomeView({
  q,
  list,
  week,
  days,
  conditions,
}: {
  q: HomeQuery
  list: Theme[]
  week: Day[]
  /** 데스크톱 날짜 칩(이번 주말 토·일) */
  days: Day[]
  conditions: string
}) {
  const router = useRouter()
  const set = (patch: Partial<HomeQuery>) =>
    router.replace(`/${toSearch({ ...q, ...patch })}`, { scroll: false })
  const tabs = tabsFor(q)
  const current = tabs[q.view === 'next' ? 1 : q.view === 'all' ? 2 : 0].href
  const acts = q.act ? q.act.split(',') : []
  const toggleAct = (a: string) => {
    const next = acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a]
    set({ act: next.length ? next.join(',') : undefined })
  }
  const reason = list[0]?.reason ?? null

  return (
    <>
      {/* ── 모바일 ── */}
      <MobileFrame tabbar>
        <MobileTopBar />
        <div className="px-5 pt-2.5">
          <TextTabs items={tabs} current={current} />
        </div>
        <div className="px-5">
          <div className="mt-[18px] flex gap-1">
            {week.map((w, i) => {
              const on = q.day ? q.day === String(w.day) : i === 0 && q.view === 'weekend'
              return (
                <button
                  key={w.day}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    set({ day: q.day === String(w.day) ? undefined : String(w.day), view: 'weekend' })
                  }
                  className={`flex h-[58px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[14px] border-0 ${on ? 'bg-ink' : 'bg-face'}`}
                >
                  <span className={`text-[11px] ${on ? 'text-white/70' : 'text-muted'}`}>{w.dow}</span>
                  <span className={`text-[16px] font-bold ${on ? 'text-white' : 'text-ink'}`}>{w.day}</span>
                </button>
              )
            })}
          </div>
          <div className="no-scrollbar mt-3.5 flex items-center gap-2 overflow-x-auto">
            <Chip selected icon="pin" onClick={() => router.push(`/filter${toSearch(q)}`)}>
              {q.origin} 출발
            </Chip>
            <Chip
              selected={q.transit === '1'}
              onClick={() => set({ transit: q.transit === '1' ? '0' : '1' })}
            >
              대중교통
            </Chip>
            <Chip selected={!!q.budget} onClick={() => router.push(`/filter${toSearch(q)}`)}>
              {q.budget ?? '예산'}
            </Chip>
            <span className="grow" />
            <Link
              href={`/filter${toSearch(q)}`}
              aria-label="조건 입력"
              className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] shadow-[inset_0_0_0_1px_var(--color-line-2)]"
            >
              <Icon name="filter" size={18} />
            </Link>
          </div>
        </div>

        <div className="px-5">
          {list.length === 0 ? (
            <NoThemes conditions={conditions} filterHref={`/filter${toSearch(q)}`} />
          ) : (
            <>
              <Link
                href="/course"
                className="relative mt-4 block h-[132px] overflow-hidden rounded-[20px] text-white no-underline"
              >
                <Photo
                  src={img.dumulmeori.src}
                  alt={img.dumulmeori.alt}
                  bg={img.dumulmeori.bg}
                  className="h-[132px] w-full"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,18,0.86)_0%,rgba(11,13,18,0.5)_55%,rgba(11,13,18,0)_100%)]" />
                <div className="absolute top-[30px] left-[22px]">
                  <div className="text-[19px] leading-[25px] font-extrabold tracking-[-0.04em]">
                    남양주가 여는
                    <br />
                    당일 테마 여행
                  </div>
                  <div className="mt-1.5 text-[12px] text-white/80">신청만 하면 코스까지 준비돼 있어요</div>
                </div>
              </Link>
              {reason && <Reason className="mt-[18px]">{reason}</Reason>}
              <div className="mt-1">
                {list.map((t) => (
                  <ThemeRow key={t.id} t={t} />
                ))}
              </div>
              <Link
                href="/course"
                className="mt-2.5 flex items-center justify-between rounded-[16px] bg-face px-[18px] py-4 text-ink no-underline"
              >
                <span>
                  <span className="block text-[14px] font-bold">코스부터 둘러보기</span>
                  <span className="mt-px block text-[12px] text-sub">
                    가고 싶은 장소 하나로 하루 코스를 받아요
                  </span>
                </span>
                <Icon name="chevron" size={18} className="text-sub" />
              </Link>
              <DemoNote />
            </>
          )}
        </div>
      </MobileFrame>

      {/* ── 데스크톱 ── */}
      <DesktopFrame>
        <div className="relative h-[260px] overflow-hidden rounded-[20px] text-white">
          <Photo
            src={img.dumulmeori.src}
            alt={img.dumulmeori.alt}
            bg={img.dumulmeori.bg}
            className="h-[260px] w-full"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,18,0.86)_0%,rgba(11,13,18,0.45)_50%,rgba(11,13,18,0)_100%)]" />
          <div className="absolute top-16 left-12">
            <div className="text-[38px] leading-[46px] font-extrabold tracking-[-0.05em]">
              남양주가 여는
              <br />
              당일 테마 여행
            </div>
            <div className="mt-2.5 text-[16px] text-white/85">
              가게·관광지·주민이 여는 테마에 신청만 하면 코스까지 준비돼 있어요
            </div>
          </div>
        </div>
        <div className="mt-11 flex items-start gap-12">
          <aside className="w-[260px] flex-none">
            <div className="pb-4 text-[18px] font-extrabold tracking-[-0.03em]">조건</div>
            <FilterGroup title="날짜">
              {days.map((w) => (
                <Chip
                  key={w.day}
                  selected={q.day === String(w.day)}
                  onClick={() =>
                    set({ day: q.day === String(w.day) ? undefined : String(w.day), view: 'weekend' })
                  }
                >
                  {w.date}
                </Chip>
              ))}
              <Chip
                selected={q.view === 'next'}
                onClick={() => set({ view: q.view === 'next' ? 'weekend' : 'next', day: undefined })}
              >
                다음 주말
              </Chip>
            </FilterGroup>
            <FilterGroup title="출발지">
              {origins.map((o) => (
                <Chip key={o} selected={q.origin === o} onClick={() => set({ origin: o })}>
                  {o}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="이동수단">
              <Chip selected={q.transit === '1'} onClick={() => set({ transit: '1' })}>
                대중교통으로 가능한 테마
              </Chip>
              <Chip selected={q.transit === '0'} onClick={() => set({ transit: '0' })}>
                자차
              </Chip>
            </FilterGroup>
            <FilterGroup title="활동">
              {activityList.map((a) => (
                <Chip key={a} selected={acts.includes(a)} onClick={() => toggleAct(a)}>
                  {a}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="예산">
              {budgets.map((b) => (
                <Chip
                  key={b}
                  selected={q.budget === b || (b === '상관없음' && !q.budget)}
                  onClick={() => set({ budget: b === '상관없음' ? undefined : b })}
                >
                  {b}
                </Chip>
              ))}
            </FilterGroup>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                block
                onClick={() => router.replace('/', { scroll: false })}
              >
                초기화
              </Button>
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-5">
              <TextTabs items={tabs} current={current} size={22} />
              <span className="grow" />
              <Link href="/course" className="text-[14px] text-sub no-underline">
                코스부터 둘러보기 ›
              </Link>
            </div>
            {list.length === 0 ? (
              <NoThemes conditions={conditions} />
            ) : (
              <>
                {reason && <Reason className="mt-3.5 text-[14px]">{reason}</Reason>}
                <div className="mt-6 grid grid-cols-3 gap-x-6 gap-y-10">
                  {list.map((t) => (
                    <ThemeTile key={t.id} t={t} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </DesktopFrame>
    </>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-[18px]">
      <div className="mb-2.5 text-[14px] font-bold">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}
