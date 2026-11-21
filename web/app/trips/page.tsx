import type { Metadata } from 'next'
import { TripsView } from '@/components/b/trips/trip-list'

export const metadata: Metadata = { title: '내 여행' }

export default function TripsPage() {
  return <TripsView tab="applying" />
}
