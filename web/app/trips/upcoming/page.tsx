import type { Metadata } from 'next'
import { TripsView } from '@/components/b/trips/trip-list'

export const metadata: Metadata = { title: '예정된 여행' }

export default function TripsUpcomingPage() {
  return <TripsView tab="upcoming" />
}
