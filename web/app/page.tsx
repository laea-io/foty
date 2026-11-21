import { HomeView } from '@/components/home/home-view'
import { parseQuery } from '@/lib/demo/filters'
import { homeData } from '@/lib/server/q/b-themes'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = parseQuery(await searchParams)
  const d = await homeData(q)
  return <HomeView q={q} list={d.list} week={d.week} days={d.days} conditions={d.conditions} />
}
