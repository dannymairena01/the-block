import { useState, useRef } from 'react'
import type { Vehicle } from '@/types/vehicle'
import { useBidStore } from '@/stores/bid-store'
import { getMinNextBid } from '@/lib/vehicles'
import { formatCAD } from '@/lib/format'
import { getAuctionStatus } from '@/lib/auction'
import { BidConfirmDialog } from './bid-confirm-dialog'
import { BuyNowDialog } from './buy-now-dialog'
import { TrendingUp, Tag } from 'lucide-react'

interface BidFormProps {
  vehicle: Vehicle & { auction_end: string }
}

export function BidForm({ vehicle }: BidFormProps) {
  const bidStore = useBidStore()
  const { currentBid, bidCount, isSold } = bidStore.getBidState(
    vehicle.id,
    vehicle.current_bid,
    vehicle.bid_count
  )

  const auctionStatus = isSold
    ? { status: 'sold' as const }
    : getAuctionStatus(vehicle.auction_start, vehicle.auction_end)

  const minNextBid = getMinNextBid(currentBid, vehicle.starting_bid)
  const [bidAmount, setBidAmount] = useState('')
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [buyNowOpen, setBuyNowOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (auctionStatus.status === 'ended') {
    return (
      <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-border)' }}>
        <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Auction Ended</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Final bid: {formatCAD(currentBid ?? vehicle.starting_bid)}</p>
      </div>
    )
  }

  if (auctionStatus.status === 'sold') {
    return (
      <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-brand-500)/10', border: '1px solid var(--color-brand-500)/30' }}>
        <p className="font-bold text-[var(--color-brand-400)]">Vehicle Purchased!</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>You bought this vehicle for {formatCAD(currentBid)}</p>
      </div>
    )
  }

  if (auctionStatus.status === 'upcoming') {
    return (
      <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-border)' }}>
        <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Auction Not Started</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Starting bid: {formatCAD(vehicle.starting_bid)}</p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(bidAmount.replace(/[^0-9.]/g, ''))
    if (!amount || amount < minNextBid) {
      setError(`Minimum bid is ${formatCAD(minNextBid)}`)
      inputRef.current?.focus()
      return
    }
    setError('')
    setConfirmOpen(true)
  }

  function handleConfirm() {
    const amount = Number(bidAmount.replace(/[^0-9.]/g, ''))
    bidStore.placeBid(vehicle.id, amount)
    setConfirmOpen(false)
    setBidAmount('')
    setSuccessMsg(`Bid placed — you are the high bidder at ${formatCAD(amount)}`)
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  function handleBuyNowConfirm() {
    bidStore.buyNow(vehicle.id, vehicle.buy_now_price!)
    setBuyNowOpen(false)
    setSuccessMsg(`Vehicle purchased for ${formatCAD(vehicle.buy_now_price)}!`)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Current bid display */}
      <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-border)' }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {currentBid !== null ? 'Current Bid' : 'Starting Bid'}
            </p>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
              {formatCAD(currentBid ?? vehicle.starting_bid)}
            </p>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {bidCount} bid{bidCount !== 1 ? 's' : ''}
          </p>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Minimum next bid: <span className="font-semibold font-mono" style={{ color: 'var(--color-text-primary)' }}>{formatCAD(minNextBid)}</span>
        </p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 animate-fade">
          {successMsg}
        </div>
      )}

      {/* Bid form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: 'var(--color-text-muted)' }}>
            $
          </span>
          <input
            ref={inputRef}
            id={`bid-input-${vehicle.id}`}
            type="number"
            className={`input pl-7 ${error ? 'input-error' : ''}`}
            placeholder={`${minNextBid.toLocaleString('en-CA')} or more`}
            value={bidAmount}
            min={minNextBid}
            step={1}
            onChange={e => {
              setBidAmount(e.target.value)
              if (error) setError('')
            }}
            aria-label="Enter bid amount"
          />
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'var(--color-red-400)' }}>{error}</p>
        )}
        <button
          id={`bid-submit-${vehicle.id}`}
          type="submit"
          className="btn btn-primary btn-full btn-lg gap-2"
        >
          <TrendingUp size={16} />
          Place Bid
        </button>
      </form>

      {/* Buy Now */}
      {vehicle.buy_now_price !== null && (
        <button
          id={`buy-now-${vehicle.id}`}
          className="btn btn-full btn-sm gap-2"
          style={{
            background: 'var(--color-brand-500)/15',
            border: '1px solid var(--color-brand-500)/30',
            color: 'var(--color-brand-400)',
          }}
          onClick={() => setBuyNowOpen(true)}
        >
          <Tag size={14} />
          Buy Now — {formatCAD(vehicle.buy_now_price)}
        </button>
      )}

      {/* Confirm dialogs */}
      {confirmOpen && (
        <BidConfirmDialog
          vehicle={vehicle}
          currentBid={currentBid ?? vehicle.starting_bid}
          yourBid={Number(bidAmount)}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
      {buyNowOpen && vehicle.buy_now_price !== null && (
        <BuyNowDialog
          vehicle={vehicle}
          price={vehicle.buy_now_price}
          onConfirm={handleBuyNowConfirm}
          onCancel={() => setBuyNowOpen(false)}
        />
      )}
    </div>
  )
}
