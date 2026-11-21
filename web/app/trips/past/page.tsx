import type { Metadata } from 'next'
import { TripsView } from '@/components/b/trips/trip-list'

export const metadata: Metadata = { title: '지난 여행' }

export default function TripsPastPage() {
  return <TripsView tab="past" />
}
