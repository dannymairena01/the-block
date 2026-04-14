import { useEffect } from 'react'
import type { Vehicle } from '@/types/vehicle'
import { formatCAD } from '@/lib/format'
import { Tag, X, AlertTriangle } from 'lucide-react'

interface BuyNowDialogProps {
  vehicle: Vehicle
  price: number
  onConfirm: () => void
  onCancel: () => void
}

export function BuyNowDialog({ vehicle, price, onConfirm, onCancel }: BuyNowDialogProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Buy Now
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

        <div className="text-center mb-4">
          <p className="text-3xl font-bold font-mono" style={{ color: 'var(--color-brand-400)' }}>
            {formatCAD(price)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>CAD · Buy Now Price</p>
        </div>

        <div className="rounded-lg px-3 py-2 mb-5 flex items-start gap-2 text-sm bg-amber-400/10 border border-amber-400/25 text-amber-400">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>This will end the auction immediately and purchase the vehicle.</span>
        </div>

        <div className="flex gap-2">
          <button
            id="buy-now-cancel"
            className="btn btn-secondary flex-1"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            id="buy-now-confirm"
            className="btn btn-primary flex-1 gap-2"
            onClick={onConfirm}
          >
            <Tag size={15} />
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  )
}
