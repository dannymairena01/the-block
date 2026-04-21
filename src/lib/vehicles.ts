import type { Vehicle, SortOption } from '@/types/vehicle'
import {
  intersect,
  unionByValues,
  type VehicleIndex,
} from '@/lib/vehicle-index'

/** Tiered bid increment — mirrors how real auctions work */
export function getMinIncrement(currentBid: number): number {
  if (currentBid < 5000) return 100
  if (currentBid < 15000) return 250
  if (currentBid < 50000) return 500
  return 1000
}

export function getMinNextBid(
  currentBid: number | null,
  startingBid: number
): number {
  if (currentBid === null) return startingBid
  return currentBid + getMinIncrement(currentBid)
}

/** Reserve status for display — never reveal the actual price */
export type ReserveStatus = 'no-reserve' | 'not-met' | 'met'

export function getReserveStatus(
  currentBid: number | null,
  reservePrice: number | null
): ReserveStatus {
  if (reservePrice === null) return 'no-reserve'
  if (currentBid === null || currentBid < reservePrice) return 'not-met'
  return 'met'
}

/** Filter and sort state */
export interface AppliedFilters {
  search: string
  minPrice: number | null
  maxPrice: number | null
  minGrade: number | null
  bodyStyles: string[]
  drivetrains: string[]
  provinces: string[]
  transmissions: string[]
  fuelTypes: string[]
  titleStatuses: string[]
  hasBuyNow: boolean | null
  sort: SortOption
}

/** Minimal view of per-vehicle bid overrides — no store reference needed. */
export type BidOverrides = Map<string, number>

type NormalizedVehicle = Vehicle & { auction_end: string }

function effectivePrice(v: NormalizedVehicle, overrides: BidOverrides): number {
  const overridden = overrides.get(v.id)
  if (overridden !== undefined) return overridden
  return v.current_bid ?? v.starting_bid
}

/** Narrow `all` down by categorical filters (set intersection, never a full scan). */
function narrowByCategoricals(
  index: VehicleIndex,
  filters: AppliedFilters,
  startingSet: Set<string>,
): Set<string> {
  let result = startingSet

  const apply = (bucket: Set<string>) => {
    result = intersect(result, bucket)
  }

  if (filters.bodyStyles.length > 0) {
    apply(unionByValues(index.byBodyStyle, filters.bodyStyles))
  }
  if (filters.drivetrains.length > 0) {
    apply(unionByValues(index.byDrivetrain, filters.drivetrains))
  }
  if (filters.provinces.length > 0) {
    apply(unionByValues(index.byProvince, filters.provinces, false))
  }
  if (filters.transmissions.length > 0) {
    apply(unionByValues(index.byTransmission, filters.transmissions))
  }
  if (filters.fuelTypes.length > 0) {
    apply(unionByValues(index.byFuelType, filters.fuelTypes))
  }
  if (filters.titleStatuses.length > 0) {
    apply(unionByValues(index.byTitleStatus, filters.titleStatuses, false))
  }
  if (filters.hasBuyNow === true) {
    apply(index.withBuyNow)
  }

  return result
}

/**
 * Indexed filter + sort. Categorical filters run as set intersections against
 * pre-built indexes. Numeric/text filters scan only the narrowed subset.
 * Stable O(k log k) where k is the post-filter result size, not O(n × filter count).
 */
export function applyFiltersAndSort(
  index: VehicleIndex,
  filters: AppliedFilters,
  overrides: BidOverrides,
): NormalizedVehicle[] {
  const ids = narrowByCategoricals(index, filters, index.all)

  const query = filters.search.trim().toLowerCase()
  const hasText = query.length > 0
  const hasMinPrice = filters.minPrice !== null
  const hasMaxPrice = filters.maxPrice !== null
  const hasMinGrade = filters.minGrade !== null

  const result: NormalizedVehicle[] = []
  for (const id of ids) {
    const v = index.byId.get(id)
    if (!v) continue

    if (hasText) {
      const tokens = index.searchTokens.get(id)
      if (!tokens || !tokens.includes(query)) continue
    }

    if (hasMinGrade && v.condition_grade < filters.minGrade!) continue

    if (hasMinPrice || hasMaxPrice) {
      const price = effectivePrice(v, overrides)
      if (hasMinPrice && price < filters.minPrice!) continue
      if (hasMaxPrice && price > filters.maxPrice!) continue
    }

    result.push(v)
  }

  sortInPlace(result, filters.sort, overrides)
  return result
}

function sortInPlace(
  arr: NormalizedVehicle[],
  sort: SortOption,
  overrides: BidOverrides,
) {
  switch (sort) {
    case 'time-remaining':
      arr.sort(
        (a, b) =>
          new Date(a.auction_end).getTime() - new Date(b.auction_end).getTime(),
      )
      return
    case 'bid-asc':
      arr.sort(
        (a, b) => effectivePrice(a, overrides) - effectivePrice(b, overrides),
      )
      return
    case 'bid-desc':
      arr.sort(
        (a, b) => effectivePrice(b, overrides) - effectivePrice(a, overrides),
      )
      return
    case 'grade-desc':
      arr.sort((a, b) => b.condition_grade - a.condition_grade)
      return
    case 'grade-asc':
      arr.sort((a, b) => a.condition_grade - b.condition_grade)
      return
    case 'odo-asc':
      arr.sort((a, b) => a.odometer_km - b.odometer_km)
      return
    case 'year-desc':
      arr.sort((a, b) => b.year - a.year)
      return
    case 'year-asc':
      arr.sort((a, b) => a.year - b.year)
      return
  }
}

export const SORT_LABELS: Record<SortOption, string> = {
  'time-remaining': 'Ending Soonest',
  'bid-asc': 'Bid: Low → High',
  'bid-desc': 'Bid: High → Low',
  'grade-desc': 'Condition: Best First',
  'grade-asc': 'Condition: Worst First',
  'odo-asc': 'Odometer: Lowest',
  'year-desc': 'Year: Newest First',
  'year-asc': 'Year: Oldest First',
}
