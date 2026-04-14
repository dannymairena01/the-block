import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { capitalize } from '@/lib/format'

// Data-driven filter options
const FILTER_OPTIONS = {
  bodyStyles: ['SUV', 'Sedan', 'Truck', 'Hatchback', 'Coupe', 'Wagon', 'Van', 'Convertible'],
  drivetrains: ['AWD', 'FWD', '4WD', 'RWD'],
  provinces: ['Ontario', 'British Columbia', 'Quebec', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick'],
  transmissions: ['Automatic', 'CVT', 'Manual'],
  fuelTypes: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
  titleStatuses: ['clean', 'rebuilt', 'salvage'] as const,
}

export interface FilterSidebarProps {
  // Price
  minPrice: number | null
  maxPrice: number | null
  onMinPriceChange: (v: number | null) => void
  onMaxPriceChange: (v: number | null) => void

  // Grade
  minGrade: number | null
  onMinGradeChange: (v: number | null) => void

  // Multi-select
  bodyStyles: string[]
  drivetrains: string[]
  provinces: string[]
  transmissions: string[]
  fuelTypes: string[]
  titleStatuses: string[]
  hasBuyNow: boolean | null

  onToggleBodyStyle: (v: string) => void
  onToggleDrivetrain: (v: string) => void
  onToggleProvince: (v: string) => void
  onToggleTransmission: (v: string) => void
  onToggleFuelType: (v: string) => void
  onToggleTitleStatus: (v: string) => void
  onToggleBuyNow: () => void

  onClearAll: () => void
  onClose: () => void
  activeFilterCount: number
  isOpen: boolean
}

export function FilterSidebar(props: FilterSidebarProps) {
  const {
    minPrice, maxPrice, onMinPriceChange, onMaxPriceChange,
    minGrade, onMinGradeChange,
    bodyStyles, drivetrains, provinces, transmissions, fuelTypes, titleStatuses, hasBuyNow,
    onToggleBodyStyle, onToggleDrivetrain, onToggleProvince,
    onToggleTransmission, onToggleFuelType, onToggleTitleStatus,
    onToggleBuyNow,
    onClearAll, onClose, activeFilterCount, isOpen,
  } = props

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          style={{ background: 'oklch(0% 0 0 / 50%)' }}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 transition-base overflow-y-auto',
          'lg:static lg:z-auto lg:h-auto lg:transition-none',
          'w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{
          background: 'var(--color-surface-1)',
          borderRight: '1px solid var(--color-surface-border)',
          paddingTop: isOpen ? 0 : 0,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 sticky top-0 z-10"
          style={{
            background: 'var(--color-surface-1)',
            borderBottom: '1px solid var(--color-surface-border)',
          }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 text-xs text-[var(--color-brand-400)]">
                ({activeFilterCount} active)
              </span>
            )}
          </h2>
          {activeFilterCount > 0 && (
            <button
              className="btn btn-ghost btn-sm text-xs gap-1"
              onClick={onClearAll}
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={12} />
              Clear all
            </button>
          )}
        </div>

        <div className="p-4 flex flex-col gap-1">
          {/* Price Range */}
          <FilterSection label="Price Range">
            <div className="flex items-center gap-2">
              <input
                id="filter-min-price"
                type="number"
                className="input text-sm"
                placeholder="Min"
                min={0}
                value={minPrice ?? ''}
                onChange={e => onMinPriceChange(e.target.value ? Number(e.target.value) : null)}
              />
              <span style={{ color: 'var(--color-text-muted)' }}>—</span>
              <input
                id="filter-max-price"
                type="number"
                className="input text-sm"
                placeholder="Max"
                min={0}
                value={maxPrice ?? ''}
                onChange={e => onMaxPriceChange(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </FilterSection>

          {/* Condition Grade */}
          <FilterSection label="Min Condition">
            <div className="flex items-center gap-3">
              <input
                id="filter-min-grade"
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={minGrade ?? 1}
                onChange={e => onMinGradeChange(e.target.value === '1' ? null : Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono font-semibold w-8 text-right" style={{ color: 'var(--color-text-primary)' }}>
                {minGrade !== null ? minGrade.toFixed(1) : 'Any'}
              </span>
            </div>
          </FilterSection>

          {/* Buy Now toggle */}
          <FilterSection label="Buy Now">
            <button
              id="filter-buy-now"
              className={cn('chip w-full justify-center', hasBuyNow && 'chip-active')}
              onClick={onToggleBuyNow}
            >
              Buy Now Available
            </button>
          </FilterSection>

          {/* Body Style */}
          <FilterSection label="Body Style">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.bodyStyles.map(opt => (
                <button
                  key={opt}
                  id={`filter-body-${opt}`}
                  className={cn('chip', bodyStyles.includes(opt) && 'chip-active')}
                  onClick={() => onToggleBodyStyle(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Drivetrain */}
          <FilterSection label="Drivetrain">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.drivetrains.map(opt => (
                <button
                  key={opt}
                  id={`filter-drive-${opt}`}
                  className={cn('chip', drivetrains.includes(opt) && 'chip-active')}
                  onClick={() => onToggleDrivetrain(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Province */}
          <FilterSection label="Province">
            <div className="flex flex-col gap-1">
              {FILTER_OPTIONS.provinces.map(opt => (
                <button
                  key={opt}
                  id={`filter-province-${opt.replace(/\s+/g, '-')}`}
                  className={cn('chip text-left justify-start', provinces.includes(opt) && 'chip-active')}
                  onClick={() => onToggleProvince(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Transmission */}
          <FilterSection label="Transmission">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.transmissions.map(opt => (
                <button
                  key={opt}
                  id={`filter-trans-${opt}`}
                  className={cn('chip', transmissions.includes(opt) && 'chip-active')}
                  onClick={() => onToggleTransmission(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Fuel Type */}
          <FilterSection label="Fuel Type">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.fuelTypes.map(opt => (
                <button
                  key={opt}
                  id={`filter-fuel-${opt}`}
                  className={cn('chip', fuelTypes.includes(opt) && 'chip-active')}
                  onClick={() => onToggleFuelType(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Title Status */}
          <FilterSection label="Title Status">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.titleStatuses.map(opt => (
                <button
                  key={opt}
                  id={`filter-title-${opt}`}
                  className={cn('chip', titleStatuses.includes(opt) && 'chip-active')}
                  onClick={() => onToggleTitleStatus(opt)}
                >
                  {capitalize(opt)}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>
      </aside>
    </>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
      <button
        className="w-full flex items-center justify-between py-2.5 text-sm font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
        onClick={() => setOpen(o => !o)}
      >
        {label}
        <ChevronDown
          size={14}
          className={cn('transition-fast', open ? 'rotate-180' : '')}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}
