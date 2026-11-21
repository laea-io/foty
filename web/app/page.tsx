import { HomeView } from '@/components/home/home-view'
import { parseQuery } from '@/lib/demo/filters'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <HomeView q={parseQuery(await searchParams)} />
}
