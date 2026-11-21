import type { Metadata } from 'next'
import Link from 'next/link'
import { SearchBox } from '@/components/a/search-box'
import { BackBar, DesktopFrame, MobileFrame } from '@/components/shell/mobile'
import { ThemeRow, ThemeTile } from '@/components/theme/cards'
import { Mascot } from '@/components/ui/mascot'
import { ButtonLink, DemoNote, Segmented } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { getViewer } from '@/lib/server/auth'
import { searchAll } from '@/lib/server/q/a'

/** 결과가 없을 때 보여 줄 추천 검색어 */
const suggestions = ['산책', '카페', '두물머리']

export const metadata: Metadata = { title: '검색' }

function NoResult() {
  return (
    <>
      <div className="flex flex-col items-center pt-[72px] text-center">
        <Mascot size={64} tone="gray" />
        <div className="mt-5 text-[18px] font-bold">찾는 결과가 없어요</div>
        <div className="mt-1.5 text-[13px] text-sub">검색어를 줄이거나 다른 말로 바꿔 보세요</div>
      </div>
      <div className="mt-5 flex justify-center gap-1.5">
        {suggestions.map((s) => (
          <Link
            key={s}
            href={`/search?q=${encodeURIComponent(s)}`}
            className="inline-flex h-11 items-center rounded-full bg-face px-4 text-[15px] font-medium text-label no-underline"
          >
            {s}
          </Link>
        ))}
      </div>
      <div className="mt-5">
        <ButtonLink href="/request" variant="outline" block>
          이런 테마 요청하기
        </ButtonLink>
      </div>
    </>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = (await searchParams).q
  const q = ((Array.isArray(raw) ? raw[0] : raw) ?? '').slice(0, 60)
  const viewer = await getViewer()
  const r = await searchAll(db, q, { prefs: viewer?.prefs.activities })
  const enc = encodeURIComponent(q)
  const tabs = [
    { href: `/search?q=${enc}`, label: `테마 ${r.themes.length}` },
    { href: `/course?q=${enc}`, label: `코스 ${r.courses}` },
    { href: `/community?q=${enc}`, label: `후기 ${r.reviews}` },
  ]
  const empty = r.themes.length === 0
  return (
    <>
      <MobileFrame>
        <BackBar title="검색" back="/" />
        <div className="px-5">
          <SearchBox q={q} />
          {empty ? (
            <NoResult />
          ) : (
            <>
              <div className="mt-3.5">
                <Segmented items={tabs} current={tabs[0].href} />
              </div>
              <div className="mt-1">
                {r.themes.map((t) => (
                  <ThemeRow key={t.id} t={t} />
                ))}
              </div>
            </>
          )}
        </div>
        <DemoNote className="pb-10" />
      </MobileFrame>
      <DesktopFrame>
        {empty ? (
          <div className="mx-auto max-w-[600px]">
            <div className="mb-2 text-[14px] text-sub">검색</div>
            <SearchBox q={q} />
            <NoResult />
          </div>
        ) : (
          <>
            <div className="max-w-[640px]">
              <SearchBox q={q} />
              <div className="mt-3.5 w-[420px]">
                <Segmented items={tabs} current={tabs[0].href} />
              </div>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-x-6 gap-y-10">
              {r.themes.map((t) => (
                <ThemeTile key={t.id} t={t} />
              ))}
            </div>
          </>
        )}
      </DesktopFrame>
    </>
  )
}
