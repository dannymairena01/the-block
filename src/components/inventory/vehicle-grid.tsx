import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import type { Vehicle } from '@/types/vehicle'
import { VehicleCard } from './vehicle-card'
import { perfEnd, perfLog, perfStart } from '@/lib/perf'

// Rows are measured dynamically via `virtualizer.measureElement` — the
// estimate below is only used before the first measurement lands, so it just
// needs to be close enough to avoid a big initial content shift.
const ROW_GAP = 16 // matches `gap-4`
const ROW_HEIGHT_ESTIMATE = 520 // image (4:3 on ~380px col) + content + gap
const CARDS_PER_ROW_BY_BREAKPOINT = { base: 1, sm: 2, lg: 3, xl: 4 } as const

interface VehicleGridProps {
  vehicles: (Vehicle & { auction_end: string })[]
  /** Kept for API compatibility; ignored by the virtualized grid. */
  page?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
}

function useColumnCount(): number {
  const [cols, setCols] = useState(() => columnsForWidth(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  ))

  useLayoutEffect(() => {
    const onResize = () => setCols(columnsForWidth(window.innerWidth))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return cols
}

function columnsForWidth(w: number): number {
  if (w >= 1280) return CARDS_PER_ROW_BY_BREAKPOINT.xl
  if (w >= 1024) return CARDS_PER_ROW_BY_BREAKPOINT.lg
  if (w >= 640) return CARDS_PER_ROW_BY_BREAKPOINT.sm
  return CARDS_PER_ROW_BY_BREAKPOINT.base
}

export function VehicleGrid({ vehicles, isLoading }: VehicleGridProps) {
  const cols = useColumnCount()
  const total = vehicles.length
  const rowCount = Math.ceil(total / cols)

  const parentRef = useRef<HTMLDivElement>(null)
  const [scrollOffset, setScrollOffset] = useState(0)

  useLayoutEffect(() => {
    if (!parentRef.current) return
    const rect = parentRef.current.getBoundingClientRect()
    setScrollOffset(rect.top + window.scrollY)
  }, [cols, total])

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT_ESTIMATE + ROW_GAP,
    overscan: 3,
    scrollMargin: scrollOffset,
  })

  // Column count changes → card widths change → row heights change. Throw
  // away cached measurements so the virtualizer re-measures on the next paint.
  useLayoutEffect(() => {
    virtualizer.measure()
  }, [cols, virtualizer])

  // Reset scroll + measurements when the filtered list identity changes.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [vehicles])

  // Time first render after data becomes available; log DOM node estimate.
  useEffect(() => {
    if (isLoading || total === 0) return
    perfStart('first-grid-render')
    const raf = requestAnimationFrame(() => {
      perfEnd('first-grid-render', `${total} filtered, ${cols} cols, ${rowCount} rows`)
      const rendered = parentRef.current?.querySelectorAll('[data-card-id]').length ?? 0
      perfLog(
        'dom-nodes',
        `${parentRef.current?.querySelectorAll('*').length ?? 0} grid nodes ` +
        `(virtualized: ${rendered} cards mounted for ${total} matched)`,
      )
    })
    return () => cancelAnimationFrame(raf)
  }, [isLoading, total, cols, rowCount])

  // Stable measureElement ref — `useWindowVirtualizer` reads `data-index` to
  // associate the node with its row. Wrapping avoids re-creating the ref fn
  // on every render, which would retrigger measurement.
  const measureRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) virtualizer.measureElement(node)
    },
    [virtualizer],
  )

  const virtualRows = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (total === 0) {
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
      <div
        ref={parentRef}
        style={{
          position: 'relative',
          height: `${totalHeight}px`,
          width: '100%',
        }}
      >
        {virtualRows.map(virtualRow => {
          const from = virtualRow.index * cols
          const rowVehicles = vehicles.slice(from, from + cols)
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={measureRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                paddingBottom: ROW_GAP,
              }}
            >
              {rowVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  data-card-id={vehicle.id}
                  style={{
                    contentVisibility: 'auto',
                    containIntrinsicSize: '360px 480px',
                  }}
                >
                  <VehicleCard vehicle={vehicle} />
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <p
        className="py-4 text-center text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Showing {total.toLocaleString()} matching vehicle{total === 1 ? '' : 's'}.
      </p>
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
