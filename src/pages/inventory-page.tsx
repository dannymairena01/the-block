import { useMemo, useState } from 'react'
import { useVehicles } from '@/hooks/use-vehicles'
import { useDebounce } from '@/hooks/use-debounce'
import { useBidStore } from '@/stores/bid-store'
import { useWatchlistStore } from '@/stores/watchlist-store'
import { applyFiltersAndSort } from '@/lib/vehicles'
import type { SortOption } from '@/types/vehicle'
import { VehicleGrid } from '@/components/inventory/vehicle-grid'
import { InventoryToolbar } from '@/components/inventory/inventory-toolbar'
import { FilterSidebar } from '@/components/inventory/filter-sidebar'

interface InventoryPageProps {
  watchlistOnly?: boolean
}

const DEFAULT_SORT: SortOption = 'time-remaining'

export function InventoryPage({ watchlistOnly = false }: InventoryPageProps) {
  const { data: vehicles = [], isLoading } = useVehicles()
  const bidStore = useBidStore()
  const watchlistStore = useWatchlistStore()

  // Filter state
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [minGrade, setMinGrade] = useState<number | null>(null)
  const [bodyStyles, setBodyStyles] = useState<string[]>([])
  const [drivetrains, setDrivetrains] = useState<string[]>([])
  const [provinces, setProvinces] = useState<string[]>([])
  const [transmissions, setTransmissions] = useState<string[]>([])
  const [fuelTypes, setFuelTypes] = useState<string[]>([])
  const [titleStatuses, setTitleStatuses] = useState<string[]>([])
  const [hasBuyNow, setHasBuyNow] = useState<boolean | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  function toggleFilter(
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) {
    setList(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
    setPage(1)
  }

  function clearAll() {
    setSearch('')
    setMinPrice(null)
    setMaxPrice(null)
    setMinGrade(null)
    setBodyStyles([])
    setDrivetrains([])
    setProvinces([])
    setTransmissions([])
    setFuelTypes([])
    setTitleStatuses([])
    setHasBuyNow(null)
    setPage(1)
    setSidebarOpen(false)
  }

  const activeFilterCount =
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minGrade ? 1 : 0) +
    bodyStyles.length +
    drivetrains.length +
    provinces.length +
    transmissions.length +
    fuelTypes.length +
    titleStatuses.length +
    (hasBuyNow ? 1 : 0)

  const filteredVehicles = useMemo(() => {
    let base = vehicles as (typeof vehicles[number] & { auction_end: string })[]

    // Watchlist filter
    if (watchlistOnly) {
      base = base.filter(v => watchlistStore.isWatched(v.id))
    }

    return applyFiltersAndSort(base, {
      search: debouncedSearch,
      minPrice,
      maxPrice,
      minGrade,
      bodyStyles,
      drivetrains,
      provinces,
      transmissions,
      fuelTypes,
      titleStatuses,
      hasBuyNow,
      sort,
    }, bidStore)
  }, [
    vehicles, watchlistOnly, watchlistStore,
    debouncedSearch, minPrice, maxPrice, minGrade,
    bodyStyles, drivetrains, provinces, transmissions,
    fuelTypes, titleStatuses, hasBuyNow, sort, bidStore,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    bidStore.bids,
  ])

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  const handleSort = (s: SortOption) => {
    setSort(s)
    setPage(1)
  }

  return (
    <div className="flex h-full min-h-screen" style={{ background: 'var(--color-surface-0)' }}>
      {/* Filter sidebar */}
      <FilterSidebar
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={v => { setMinPrice(v); setPage(1) }}
        onMaxPriceChange={v => { setMaxPrice(v); setPage(1) }}
        minGrade={minGrade}
        onMinGradeChange={v => { setMinGrade(v); setPage(1) }}
        bodyStyles={bodyStyles}
        drivetrains={drivetrains}
        provinces={provinces}
        transmissions={transmissions}
        fuelTypes={fuelTypes}
        titleStatuses={titleStatuses}
        hasBuyNow={hasBuyNow}
        onToggleBodyStyle={v => toggleFilter(bodyStyles, setBodyStyles, v)}
        onToggleDrivetrain={v => toggleFilter(drivetrains, setDrivetrains, v)}
        onToggleProvince={v => toggleFilter(provinces, setProvinces, v)}
        onToggleTransmission={v => toggleFilter(transmissions, setTransmissions, v)}
        onToggleFuelType={v => toggleFilter(fuelTypes, setFuelTypes, v)}
        onToggleTitleStatus={v => toggleFilter(titleStatuses, setTitleStatuses, v)}
        onToggleBuyNow={() => { setHasBuyNow(h => h ? null : true); setPage(1) }}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        isOpen={sidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <InventoryToolbar
          search={search}
          onSearchChange={handleSearch}
          sort={sort}
          onSortChange={handleSort}
          totalCount={vehicles.length}
          filteredCount={filteredVehicles.length}
          activeFilterCount={activeFilterCount}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
        />

        {/* Watchlist empty state */}
        {watchlistOnly && filteredVehicles.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="text-5xl mb-4">🔖</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              No saved vehicles yet
            </h2>
            <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
              Browse the inventory and tap the bookmark icon on any vehicle to save it here.
            </p>
            <a
              href="/"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Browse Inventory →
            </a>
          </div>
        )}

        {/* Grid */}
        {(!watchlistOnly || filteredVehicles.length > 0) && (
          <div className="p-4">
            <VehicleGrid
              vehicles={filteredVehicles}
              page={page}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
