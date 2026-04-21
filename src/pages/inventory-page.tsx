import { useEffect, useMemo, useRef, useState } from 'react'
import { useVehicles } from '@/hooks/use-vehicles'
import { useDebounce } from '@/hooks/use-debounce'
import { useBidOverridesSnapshot } from '@/stores/bid-store'
import { useWatchlistStore } from '@/stores/watchlist-store'
import { applyFiltersAndSort } from '@/lib/vehicles'
import { intersect, type VehicleIndex } from '@/lib/vehicle-index'
import { perfEnd, perfMeasure, perfStart } from '@/lib/perf'
import type { SortOption } from '@/types/vehicle'
import { VehicleGrid } from '@/components/inventory/vehicle-grid'
import { InventoryToolbar } from '@/components/inventory/inventory-toolbar'
import { FilterSidebar } from '@/components/inventory/filter-sidebar'

interface InventoryPageProps {
  watchlistOnly?: boolean
}

const DEFAULT_SORT: SortOption = 'time-remaining'

const EMPTY_INDEX: VehicleIndex = {
  all: new Set(),
  byId: new Map(),
  byBodyStyle: new Map(),
  byDrivetrain: new Map(),
  byProvince: new Map(),
  byTransmission: new Map(),
  byFuelType: new Map(),
  byTitleStatus: new Map(),
  withBuyNow: new Set(),
  searchTokens: new Map(),
}

export function InventoryPage({ watchlistOnly = false }: InventoryPageProps) {
  const { data, isLoading } = useVehicles()
  const index = data?.index ?? EMPTY_INDEX
  const totalCount = data?.vehicles.length ?? 0
  const overrides = useBidOverridesSnapshot()
  const watchedIds = useWatchlistStore(s => s.watchedIds)

  // Filter state
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT)
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

  // Track keystroke → debounced-commit latency so the audit can show the
  // real "time for a keystroke to produce updated results" at scale.
  const searchKeystrokeRef = useRef<string>(search)
  useEffect(() => {
    if (searchKeystrokeRef.current !== search) {
      perfStart('search-keystroke')
      searchKeystrokeRef.current = search
    }
  }, [search])
  useEffect(() => {
    perfEnd('search-keystroke', `query="${debouncedSearch}"`)
  }, [debouncedSearch])

  function toggleFilter(
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) {
    setList(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
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

  const scopedIndex = useMemo<VehicleIndex>(() => {
    if (!watchlistOnly) return index
    // Narrow `all` to watched ids — categorical buckets still work for intersection.
    const narrowed = intersect(index.all, watchedIds)
    return { ...index, all: narrowed }
  }, [index, watchlistOnly, watchedIds])

  const filteredVehicles = useMemo(() => {
    return perfMeasure(
      'filter-pipeline',
      () => applyFiltersAndSort(
        scopedIndex,
        {
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
        },
        overrides,
      ),
      `n=${scopedIndex.all.size}`,
    )
  }, [
    scopedIndex,
    debouncedSearch, minPrice, maxPrice, minGrade,
    bodyStyles, drivetrains, provinces, transmissions,
    fuelTypes, titleStatuses, hasBuyNow, sort, overrides,
  ])

  // Facet-change timing: measure from the first non-search facet flip to
  // the next filtered result. Search has its own dedicated timer above.
  const facetSignature =
    `${minPrice}|${maxPrice}|${minGrade}|` +
    `${bodyStyles.join(',')}|${drivetrains.join(',')}|${provinces.join(',')}|` +
    `${transmissions.join(',')}|${fuelTypes.join(',')}|${titleStatuses.join(',')}|` +
    `${hasBuyNow}|${sort}`
  const prevFacetSignatureRef = useRef<string>(facetSignature)
  useEffect(() => {
    if (prevFacetSignatureRef.current !== facetSignature) {
      perfStart('facet-change')
      prevFacetSignatureRef.current = facetSignature
    }
  }, [facetSignature])
  useEffect(() => {
    perfEnd('facet-change', `matched=${filteredVehicles.length}`)
  }, [filteredVehicles])

  const handleSearch = (q: string) => {
    setSearch(q)
  }

  const handleSort = (s: SortOption) => {
    setSort(s)
  }

  return (
    <div className="flex h-full min-h-screen" style={{ background: 'var(--color-surface-0)' }}>
      {/* Filter sidebar */}
      <FilterSidebar
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        minGrade={minGrade}
        onMinGradeChange={setMinGrade}
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
        onToggleBuyNow={() => setHasBuyNow(h => h ? null : true)}
        onClearAll={clearAll}
        onClose={() => setSidebarOpen(false)}
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
          totalCount={totalCount}
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
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
