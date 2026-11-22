import type { Metadata } from 'next'
import { FilterSheet } from '@/components/b/theme/filter-sheet'
import { HomeView } from '@/components/home/home-view'
import { parseQuery } from '@/lib/demo/filters'
import { homeData } from '@/lib/server/q/b-themes'
import { defaultOrigin } from '@/lib/server/q/themes'

export const metadata: Metadata = { title: '조건 입력' }

/** 조건 입력: 홈 위에 시트. 홈과 같은 쿼리(day·origin·transit·budget·act·view)를 읽고, 적용하면 /로 */
export default async function FilterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = parseQuery(await searchParams)
  q.origin ??= await defaultOrigin()
  const d = await homeData(q)
  return (
    <>
      <HomeView q={q} list={d.list} week={d.week} days={d.days} dates={d.dates} conditions={d.conditions} />
      <FilterSheet q={q} dates={d.dates} count={d.list.length} />
    </>
  )
}
