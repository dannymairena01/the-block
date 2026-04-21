import type { Vehicle } from '@/types/vehicle'

type NormalizedVehicle = Vehicle & { auction_end: string }

export interface VehicleIndex {
  all: Set<string>
  byId: Map<string, NormalizedVehicle>
  byBodyStyle: Map<string, Set<string>>
  byDrivetrain: Map<string, Set<string>>
  byProvince: Map<string, Set<string>>
  byTransmission: Map<string, Set<string>>
  byFuelType: Map<string, Set<string>>
  byTitleStatus: Map<string, Set<string>>
  withBuyNow: Set<string>
  /** Pre-lowercased haystack per vehicle for fast text search */
  searchTokens: Map<string, string>
}

function bucket<K>(map: Map<K, Set<string>>, key: K, id: string) {
  let set = map.get(key)
  if (!set) {
    set = new Set<string>()
    map.set(key, set)
  }
  set.add(id)
}

export function buildVehicleIndex(vehicles: NormalizedVehicle[]): VehicleIndex {
  const index: VehicleIndex = {
    all: new Set<string>(),
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

  for (const v of vehicles) {
    index.all.add(v.id)
    index.byId.set(v.id, v)
    bucket(index.byBodyStyle, v.body_style.toLowerCase(), v.id)
    bucket(index.byDrivetrain, v.drivetrain.toLowerCase(), v.id)
    bucket(index.byProvince, v.province, v.id)
    bucket(index.byTransmission, v.transmission.toLowerCase(), v.id)
    bucket(index.byFuelType, v.fuel_type.toLowerCase(), v.id)
    bucket(index.byTitleStatus, v.title_status, v.id)
    if (v.buy_now_price !== null) index.withBuyNow.add(v.id)
    index.searchTokens.set(
      v.id,
      `${v.year} ${v.make} ${v.model} ${v.trim} ${v.vin}`.toLowerCase(),
    )
  }

  return index
}

/** Intersect two sets, returning the smaller one narrowed by the other. */
export function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  const out = new Set<string>()
  for (const id of small) if (large.has(id)) out.add(id)
  return out
}

/** Pick the union of buckets keyed by each value in `values`. Case-insensitive lookup. */
export function unionByValues(
  map: Map<string, Set<string>>,
  values: string[],
  caseInsensitive = true,
): Set<string> {
  const out = new Set<string>()
  for (const v of values) {
    const key = caseInsensitive ? v.toLowerCase() : v
    const bucket = map.get(key)
    if (!bucket) continue
    for (const id of bucket) out.add(id)
  }
  return out
}
