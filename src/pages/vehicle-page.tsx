import { Link, useParams } from 'react-router-dom'
import { useVehicle } from '@/hooks/use-vehicles'
import { useBidStore } from '@/stores/bid-store'
import { getAuctionStatus } from '@/lib/auction'
import { getReserveStatus } from '@/lib/vehicles'
import { CountdownTimer, StartTimer } from '@/components/shared/countdown-timer'
import { ReserveBadge } from '@/components/shared/reserve-badge'
import { TitleBadge } from '@/components/shared/title-badge'
import { VehicleGallery } from '@/components/vehicle/vehicle-gallery'
import { VehicleSpecs } from '@/components/vehicle/vehicle-specs'
import { VehicleCondition } from '@/components/vehicle/vehicle-condition'
import { VehicleDealer } from '@/components/vehicle/vehicle-dealer'
import { BidForm } from '@/components/bid/bid-form'
import { BidHistory } from '@/components/vehicle/bid-history'
import { WatchlistButton } from '@/components/watchlist/watchlist-button'
import { ChevronLeft } from 'lucide-react'

export function VehiclePage() {
  const { id } = useParams<{ id: string }>()
  const { data: vehicle, isLoading, error } = useVehicle(id!)
  const bidStore = useBidStore()

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="skeleton h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="flex flex-col gap-6">
            <div className="skeleton aspect-[16/10] rounded-xl" />
            <div className="skeleton h-40 rounded-xl" />
          </div>
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-5xl mb-4">🚗</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Vehicle not found
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          This vehicle may no longer be available.
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Back to Inventory
        </Link>
      </div>
    )
  }

  const { currentBid, isSold } = bidStore.getBidState(
    vehicle.id,
    vehicle.current_bid,
    vehicle.bid_count
  )

  const auctionStatus = isSold
    ? { status: 'sold' as const }
    : getAuctionStatus(vehicle.auction_start, vehicle.auction_end)

  const reserveStatus = getReserveStatus(currentBid, vehicle.reserve_price)
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-5">
        <Link
          to="/"
          className="btn btn-ghost btn-sm gap-1 pl-0"
          style={{ textDecoration: 'none', color: 'var(--color-text-muted)' }}
        >
          <ChevronLeft size={16} />
          All Vehicles
        </Link>
        <WatchlistButton vehicleId={vehicle.id} size="md" />
      </div>

      {/* Title */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {vehicleName}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {vehicle.trim} · {vehicle.exterior_color} · {vehicle.year}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TitleBadge status={vehicle.title_status} />
            {auctionStatus.status === 'active' || auctionStatus.status === 'ending-soon'
              ? <CountdownTimer targetDate={vehicle.auction_end} />
              : auctionStatus.status === 'upcoming'
              ? <StartTimer targetDate={vehicle.auction_start} />
              : null
            }
          </div>
        </div>
      </div>

      {/* Main layout: gallery + aside */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <VehicleGallery images={vehicle.images} vehicleName={vehicleName} />
          <div className="card p-5">
            <VehicleCondition vehicle={vehicle} />
          </div>
          <div className="card p-5">
            <VehicleSpecs vehicle={vehicle} />
          </div>
          <div className="card p-5">
            <VehicleDealer vehicle={vehicle} />
          </div>
        </div>

        {/* Right column (sticky on desktop) */}
        <div className="flex flex-col gap-4">
          <div
            className="lg:sticky"
            style={{ top: '76px' }}
          >
            {/* Reserve + auction status */}
            <div className="card p-4 mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Auction Status
                </span>
                <div className="flex items-center gap-2">
                  <ReserveBadge status={reserveStatus} />
                </div>
              </div>
              {(auctionStatus.status === 'active' || auctionStatus.status === 'ending-soon') && (
                <CountdownTimer targetDate={vehicle.auction_end} prefix="Ends in " />
              )}
              {auctionStatus.status === 'upcoming' && (
                <StartTimer targetDate={vehicle.auction_start} />
              )}
              {auctionStatus.status === 'ended' && (
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Auction has ended</span>
              )}
              {auctionStatus.status === 'sold' && (
                <span className="text-sm text-emerald-400">Vehicle sold via Buy Now</span>
              )}
            </div>

            {/* Bid form */}
            <div className="card p-4">
              <BidForm vehicle={vehicle} />
            </div>

            {/* Bid history */}
            <div className="mt-4">
              <BidHistory vehicleId={vehicle.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
