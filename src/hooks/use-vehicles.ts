import { useQuery } from '@tanstack/react-query'
import type { Vehicle } from '@/types/vehicle'
import { normalizeAuctionTimes } from '@/lib/auction'
import rawData from '../../data/vehicles.json'

// Normalize once at module load — never changes
const normalizedVehicles = normalizeAuctionTimes(rawData as Vehicle[]) as (Vehicle & { auction_end: string })[]

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: () => normalizedVehicles,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => normalizedVehicles.find(v => v.id === id) ?? null,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
