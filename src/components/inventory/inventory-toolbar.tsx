import { useRef } from 'react'
import type { SortOption } from '@/types/vehicle'
import { SORT_LABELS } from '@/lib/vehicles'
import { Search, X, SlidersHorizontal } from 'lucide-react'

interface InventoryToolbarProps {
  search: string
  onSearchChange: (q: string) => void
  sort: SortOption
  onSortChange: (s: SortOption) => void
  totalCount: number
  filteredCount: number
  activeFilterCount: number
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function InventoryToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  totalCount,
  filteredCount,
  activeFilterCount,
  onToggleSidebar,
}: InventoryToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className="flex items-center gap-3 p-3 border-b sticky top-[60px] z-20"
      style={{
        background: 'var(--color-surface-0)',
        borderColor: 'var(--color-surface-border)',
      }}
    >
      {/* Filter toggle (mobile + desktop) */}
      <button
        id="filter-sidebar-toggle"
        className="btn btn-secondary btn-sm shrink-0 gap-2"
        onClick={onToggleSidebar}
        aria-label="Toggle filters"
      >
        <SlidersHorizontal size={14} />
        <span className="hidden sm:inline">Filters</span>
        {activeFilterCount > 0 && (
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
            style={{ background: 'var(--color-brand-500)' }}
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          ref={inputRef}
          id="vehicle-search"
          type="text"
          className="input pl-9 pr-8 text-sm"
          placeholder="Search make, model, year, VIN…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search vehicles"
        />
        {search && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 btn-ghost rounded-full p-0.5"
            onClick={() => {
              onSearchChange('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <X size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}
      </div>

      {/* Result count */}
      <p
        className="text-sm shrink-0 hidden md:block"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {filteredCount === totalCount
          ? `${totalCount} vehicles`
          : `${filteredCount} of ${totalCount}`}
      </p>

      {/* Sort */}
      <select
        id="vehicle-sort"
        className="input text-sm shrink-0 w-auto"
        style={{ width: 'auto', minWidth: 160 }}
        value={sort}
        onChange={e => onSortChange(e.target.value as SortOption)}
        aria-label="Sort vehicles"
      >
        {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  )
}
