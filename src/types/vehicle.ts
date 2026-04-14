// Vehicle data types matching the JSON schema exactly

export interface Vehicle {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string
  body_style: string
  exterior_color: string
  interior_color: string
  engine: string
  transmission: string
  drivetrain: string
  odometer_km: number
  fuel_type: string
  condition_grade: number
  condition_report: string
  damage_notes: string[]
  title_status: 'clean' | 'rebuilt' | 'salvage'
  province: string
  city: string
  auction_start: string
  starting_bid: number
  reserve_price: number | null
  buy_now_price: number | null
  images: string[]
  selling_dealership: string
  lot: string
  current_bid: number | null
  bid_count: number
}

export interface BidRecord {
  vehicleId: string
  amount: number
  timestamp: number
  type: 'bid' | 'buy-now'
}

export type AuctionStatus =
  | { status: 'upcoming'; startsIn: number }
  | { status: 'active'; timeRemaining: number }
  | { status: 'ending-soon'; timeRemaining: number }
  | { status: 'ended' }
  | { status: 'sold' }

export type SortOption =
  | 'time-remaining'
  | 'bid-asc'
  | 'bid-desc'
  | 'grade-desc'
  | 'grade-asc'
  | 'odo-asc'
  | 'year-desc'
  | 'year-asc'

export interface FilterState {
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
  page: number
}
