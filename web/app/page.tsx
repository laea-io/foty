import { HomeView } from '@/components/home/home-view'
import { homeData } from '@/lib/server/queries/theme-screens'
import { defaultOrigin } from '@/lib/server/queries/themes'
import { parseQuery } from '@/lib/shared/filters'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = parseQuery(await searchParams)
  q.origin ??= await defaultOrigin()
  const d = await homeData(q)
  return (
    <HomeView q={q} list={d.list} week={d.week} days={d.days} dates={d.dates} conditions={d.conditions} />
  )
}
