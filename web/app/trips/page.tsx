import type { Metadata } from 'next'
import { TripsView } from '@/components/b/trips/trip-list'
import { requireViewer } from '@/lib/server/auth'
import { myTrips } from '@/lib/server/q/b-trips'

export const metadata: Metadata = { title: '내 여행' }

export default async function TripsPage() {
  const viewer = await requireViewer('/trips')
  return <TripsView tab="applying" data={await myTrips(viewer.id)} />
}
