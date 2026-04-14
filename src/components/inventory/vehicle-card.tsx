import { Link } from 'react-router-dom'
import type { Vehicle } from '@/types/vehicle'
import { useBidStore } from '@/stores/bid-store'
import { getAuctionStatus } from '@/lib/auction'
import { getMinNextBid, getReserveStatus } from '@/lib/vehicles'
import { formatCAD, formatOdometer, capitalize } from '@/lib/format'
import { CountdownTimer, StartTimer } from '@/components/shared/countdown-timer'
import { ConditionBadge } from '@/components/shared/condition-badge'
import { TitleBadge } from '@/components/shared/title-badge'
import { ReserveBadge } from '@/components/shared/reserve-badge'
import { WatchlistButton } from '@/components/watchlist/watchlist-button'
import { MapPin, Gauge, TriangleAlert, Tag } from 'lucide-react'

interface VehicleCardProps {
  vehicle: Vehicle & { auction_end: string }
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const bidStore = useBidStore()
  const { currentBid, bidCount, isSold } = bidStore.getBidState(
    vehicle.id,
    vehicle.current_bid,
    vehicle.bid_count
  )

  const auctionStatus = isSold
    ? { status: 'sold' as const }
    : getAuctionStatus(vehicle.auction_start, vehicle.auction_end)

  const reserveStatus = getReserveStatus(currentBid, vehicle.reserve_price)
  const minNextBid = getMinNextBid(currentBid, vehicle.starting_bid)
  const displayBid = currentBid ?? vehicle.starting_bid

  const isEnded = auctionStatus.status === 'ended' || auctionStatus.status === 'sold'
  const isUpcoming = auctionStatus.status === 'upcoming'

  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      id={`vehicle-card-${vehicle.id}`}
      className="card block group transition-base hover:border-[var(--color-brand-500)] hover:-translate-y-0.5 hover:shadow-xl"
      style={{ textDecoration: 'none' }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[calc(var(--radius-card)-1px)] bg-[var(--color-surface-2)]">
        <img
          src={vehicle.images[0]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover transition-slow group-hover:scale-[1.03]"
          loading="lazy"
          onError={e => {
            e.currentTarget.src = '/placeholder-vehicle.svg'
          }}
        />

        {/* Top-left: Status overlay */}
        <div className="absolute top-2 left-2">
          {auctionStatus.status === 'sold' && (
            <span className="badge bg-[var(--color-brand-500)] text-white border-0">SOLD</span>
          )}
          {auctionStatus.status === 'ended' && (
            <span className="badge bg-[var(--color-surface-3)] border border-[var(--color-surface-border)] text-[var(--color-text-muted)]">ENDED</span>
          )}
          {auctionStatus.status === 'upcoming' && (
            <StartTimer targetDate={vehicle.auction_start} />
          )}
          {(auctionStatus.status === 'active' || auctionStatus.status === 'ending-soon') && (
            <CountdownTimer targetDate={vehicle.auction_end} compact />
          )}
        </div>

        {/* Top-right: Watchlist */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-fast">
          <div className="bg-[var(--color-surface-0)]/80 backdrop-blur-sm rounded-full">
            <WatchlistButton vehicleId={vehicle.id} size="sm" />
          </div>
        </div>

        {/* Buy Now badge */}
        {vehicle.buy_now_price !== null && !isEnded && (
          <div className="absolute bottom-2 right-2">
            <span className="badge bg-[var(--color-brand-500)]/90 text-white border-0 backdrop-blur-sm gap-1">
              <Tag size={9} />
              Buy Now
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        {/* Title row */}
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
              #{vehicle.lot}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {vehicle.trim}
          </p>
        </div>

        {/* Key stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          <ConditionBadge grade={vehicle.condition_grade} size="sm" />
          <TitleBadge status={vehicle.title_status} />
          {vehicle.damage_notes.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
              <TriangleAlert size={9} />
              {vehicle.damage_notes.length} note{vehicle.damage_notes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1">
            <Gauge size={11} />
            {formatOdometer(vehicle.odometer_km)}
          </span>
          <span>{capitalize(vehicle.drivetrain)}</span>
          <span>{capitalize(vehicle.transmission)}</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-surface-border)' }} />

        {/* Bid row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {currentBid !== null ? 'Current Bid' : 'Starting Bid'}
            </p>
            <p className="text-base font-bold font-mono" style={{ color: isEnded ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
              {formatCAD(displayBid)}
            </p>
            {!isEnded && !isUpcoming && (
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                Min {formatCAD(minNextBid)} · {bidCount} bid{bidCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <ReserveBadge status={reserveStatus} />
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={10} />
              {vehicle.city}, {vehicle.province}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
