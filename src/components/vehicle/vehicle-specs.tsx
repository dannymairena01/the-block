import type { Vehicle } from '@/types/vehicle'
import { formatOdometer, capitalize } from '@/lib/format'
import { Gauge, Fuel, Settings2, Car, Palette } from 'lucide-react'

interface VehicleSpecsProps {
  vehicle: Vehicle
}

const specRow = (icon: React.ReactNode, label: string, value: string) => (
  <div className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
    <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
    <span className="text-sm flex-1" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
)

export function VehicleSpecs({ vehicle }: VehicleSpecsProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Specifications
      </h2>
      <div>
        {specRow(<Gauge size={15} />, 'Odometer', formatOdometer(vehicle.odometer_km))}
        {specRow(<Car size={15} />, 'Engine', vehicle.engine)}
        {specRow(<Settings2 size={15} />, 'Transmission', capitalize(vehicle.transmission))}
        {specRow(<Car size={15} />, 'Drivetrain', vehicle.drivetrain)}
        {specRow(<Fuel size={15} />, 'Fuel Type', capitalize(vehicle.fuel_type))}
        {specRow(<Palette size={15} />, 'Exterior', vehicle.exterior_color)}
        {specRow(<Palette size={15} />, 'Interior', vehicle.interior_color)}
        {specRow(<Car size={15} />, 'Body Style', vehicle.body_style)}
        {specRow(<Car size={15} />, 'VIN', vehicle.vin)}
      </div>
    </section>
  )
}
