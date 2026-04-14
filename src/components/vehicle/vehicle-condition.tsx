import type { Vehicle } from '@/types/vehicle'
import { ConditionBadge } from '@/components/shared/condition-badge'
import { TitleBadge } from '@/components/shared/title-badge'
import { TriangleAlert } from 'lucide-react'

interface VehicleConditionProps {
  vehicle: Vehicle
}

export function VehicleCondition({ vehicle }: VehicleConditionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Condition
      </h2>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <ConditionBadge grade={vehicle.condition_grade} size="lg" />
        <TitleBadge status={vehicle.title_status} />
      </div>

      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {vehicle.condition_report}
      </p>

      {vehicle.damage_notes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-amber-400)' }}>
            <TriangleAlert size={12} />
            Damage Notes ({vehicle.damage_notes.length})
          </h3>
          <ul className="space-y-1.5">
            {vehicle.damage_notes.map((note, i) => (
              <li
                key={i}
                className="text-sm flex items-start gap-2 pl-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span className="text-amber-400 mt-0.5 shrink-0">·</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
