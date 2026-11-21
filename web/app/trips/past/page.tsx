import type { Metadata } from 'next'
import { TripsView } from '@/components/b/trips/trip-list'
import { requireViewer } from '@/lib/server/auth'
import { myTrips } from '@/lib/server/q/b-trips'

export const metadata: Metadata = { title: '지난 여행' }

export default async function TripsPastPage() {
  const viewer = await requireViewer('/trips/past')
  return <TripsView tab="past" data={await myTrips(viewer.id)} />
}
