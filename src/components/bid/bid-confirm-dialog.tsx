import type { Vehicle } from '@/types/vehicle'
import { formatCAD } from '@/lib/format'
import { TrendingUp, X } from 'lucide-react'

interface BidConfirmDialogProps {
  vehicle: Vehicle
  currentBid: number
  yourBid: number
  onConfirm: () => void
  onCancel: () => void
}

export function BidConfirmDialog({ vehicle, currentBid, yourBid, onConfirm, onCancel }: BidConfirmDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Confirm Your Bid
          </h2>
          <button className="btn btn-ghost p-1" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="rounded-lg p-3 mb-4 space-y-1.5" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-border)' }}>
          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Lot #{vehicle.lot} · {vehicle.vin}
          </p>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Current bid</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              {formatCAD(currentBid)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Your bid</span>
            <span className="font-mono font-bold text-base" style={{ color: 'var(--color-brand-400)' }}>
              {formatCAD(yourBid)}
            </span>
          </div>
          <div style={{ borderTop: '1px solid var(--color-surface-border)' }} className="pt-2">
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              You are about to place a bid of <strong>{formatCAD(yourBid)} CAD</strong>. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="bid-cancel"
            className="btn btn-secondary flex-1"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            id="bid-confirm"
            className="btn btn-primary flex-1 gap-2"
            onClick={onConfirm}
          >
            <TrendingUp size={15} />
            Confirm Bid
          </button>
        </div>
      </div>
    </div>
  )
}
