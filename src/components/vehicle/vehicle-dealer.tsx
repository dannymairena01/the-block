import type { Vehicle } from '@/types/vehicle'
import { MapPin, Building2, Hash } from 'lucide-react'

interface VehicleDealerProps {
  vehicle: Vehicle
}

export function VehicleDealer({ vehicle }: VehicleDealerProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Selling Dealership
      </h2>
      <div className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-border)' }}>
        <div className="flex items-center gap-2.5">
          <Building2 size={16} style={{ color: 'var(--color-brand-400)', flexShrink: 0 }} />
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {vehicle.selling_dealership}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {vehicle.city}, {vehicle.province}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Hash size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Lot <span className="font-mono font-semibold">{vehicle.lot}</span>
          </span>
        </div>
      </div>
    </section>
  )
}
