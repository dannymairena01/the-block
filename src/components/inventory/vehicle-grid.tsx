import type { Vehicle } from '@/types/vehicle'
import { VehicleCard } from './vehicle-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

interface VehicleGridProps {
  vehicles: (Vehicle & { auction_end: string })[]
  page: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function VehicleGrid({ vehicles, page, onPageChange, isLoading }: VehicleGridProps) {
  const totalPages = Math.max(1, Math.ceil(vehicles.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const paginated = vehicles.slice(start, start + PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          No vehicles match your filters
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Try adjusting your search or clearing some filters.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={vehicles.length}
          startIndex={start}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-3 flex flex-col gap-2.5">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="flex gap-2">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-16" />
        </div>
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-5 w-24 mt-1" />
      </div>
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  startIndex: number
  pageSize: number
}

function Pagination({ page, totalPages, onPageChange, totalItems, startIndex, pageSize }: PaginationProps) {
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const pages = buildPageRange(page, totalPages)

  return (
    <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Showing {startIndex + 1}–{endIndex} of {totalItems} vehicles
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>…</span>
          ) : (
            <button
              key={p}
              className="btn btn-sm min-w-[32px]"
              style={
                page === p
                  ? { background: 'var(--color-brand-500)', color: 'white' }
                  : { background: 'transparent', color: 'var(--color-text-secondary)' }
              }
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
