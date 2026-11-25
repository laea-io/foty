import type { Metadata } from 'next'
import { TripsView } from '@/components/trips/trip-list'
import { requireViewer } from '@/lib/server/auth/session'
import { myTrips } from '@/lib/server/queries/trips'

export const metadata: Metadata = { title: '지난 여행' }

export default async function TripsPastPage() {
  const viewer = await requireViewer('/trips/past')
  return <TripsView tab="past" data={await myTrips(viewer.id)} />
}
