import type { Vehicle, SortOption } from '@/types/vehicle'
import type { BidState } from '@/stores/bid-store'

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

/** Filter and sort vehicles based on filter state */
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

export function applyFiltersAndSort(
  vehicles: (Vehicle & { auction_end: string })[],
  filters: AppliedFilters,
  bidStore: BidState
): (Vehicle & { auction_end: string })[] {
  let result = [...vehicles]

  // Text search
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(v =>
      `${v.year} ${v.make} ${v.model} ${v.trim} ${v.vin}`
        .toLowerCase()
        .includes(q)
    )
  }

  // Price range
  if (filters.minPrice !== null) {
    result = result.filter(v => {
      const bid = bidStore.getEffectiveBid(v.id, v.current_bid)
      const price = bid ?? v.starting_bid
      return price >= filters.minPrice!
    })
  }
  if (filters.maxPrice !== null) {
    result = result.filter(v => {
      const bid = bidStore.getEffectiveBid(v.id, v.current_bid)
      const price = bid ?? v.starting_bid
      return price <= filters.maxPrice!
    })
  }

  // Condition grade
  if (filters.minGrade !== null) {
    result = result.filter(v => v.condition_grade >= filters.minGrade!)
  }

  // Multi-select filters (OR within category, AND across categories)
  if (filters.bodyStyles.length > 0) {
    result = result.filter(v =>
      filters.bodyStyles.some(
        b => v.body_style.toLowerCase() === b.toLowerCase()
      )
    )
  }
  if (filters.drivetrains.length > 0) {
    result = result.filter(v =>
      filters.drivetrains.some(
        d => v.drivetrain.toLowerCase() === d.toLowerCase()
      )
    )
  }
  if (filters.provinces.length > 0) {
    result = result.filter(v => filters.provinces.includes(v.province))
  }
  if (filters.transmissions.length > 0) {
    result = result.filter(v =>
      filters.transmissions.some(
        t => v.transmission.toLowerCase() === t.toLowerCase()
      )
    )
  }
  if (filters.fuelTypes.length > 0) {
    result = result.filter(v =>
      filters.fuelTypes.some(
        f => v.fuel_type.toLowerCase() === f.toLowerCase()
      )
    )
  }
  if (filters.titleStatuses.length > 0) {
    result = result.filter(v => filters.titleStatuses.includes(v.title_status))
  }
  if (filters.hasBuyNow === true) {
    result = result.filter(v => v.buy_now_price !== null)
  }

  // Sort
  result.sort((a, b) => {
    const bidA = bidStore.getEffectiveBid(a.id, a.current_bid)
    const bidB = bidStore.getEffectiveBid(b.id, b.current_bid)

    switch (filters.sort) {
      case 'time-remaining': {
        const endA = new Date(a.auction_end).getTime()
        const endB = new Date(b.auction_end).getTime()
        return endA - endB
      }
      case 'bid-asc': {
        const pa = bidA ?? a.starting_bid
        const pb = bidB ?? b.starting_bid
        return pa - pb
      }
      case 'bid-desc': {
        const pa = bidA ?? a.starting_bid
        const pb = bidB ?? b.starting_bid
        return pb - pa
      }
      case 'grade-desc':
        return b.condition_grade - a.condition_grade
      case 'grade-asc':
        return a.condition_grade - b.condition_grade
      case 'odo-asc':
        return a.odometer_km - b.odometer_km
      case 'year-desc':
        return b.year - a.year
      case 'year-asc':
        return a.year - b.year
      default:
        return 0
    }
  })

  return result
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
