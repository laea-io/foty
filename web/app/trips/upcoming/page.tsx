import type { Metadata } from 'next'
import { TripsView } from '@/components/trips/trip-list'
import { requireViewer } from '@/lib/server/auth/session'
import { myTrips } from '@/lib/server/queries/trips'

export const metadata: Metadata = { title: '예정된 여행' }

export default async function TripsUpcomingPage() {
  const viewer = await requireViewer('/trips/upcoming')
  return <TripsView tab="upcoming" data={await myTrips(viewer.id)} />
}
