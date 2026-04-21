#!/usr/bin/env node
/**
 * Pipeline benchmark for the vehicle filter/sort/search code-paths.
 *
 * Uses the real production modules (`src/lib/auction.ts`,
 * `src/lib/vehicle-index.ts`, `src/lib/vehicles.ts`) against both the seed
 * (200 vehicles) and the synthetic (20,000 vehicles) datasets. Reports
 * wall-clock timings in ms so we can quantify optimizations.
 *
 * Usage:  npx tsx scripts/bench-filter.ts
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Vehicle } from '../src/types/vehicle.ts'
import { normalizeAuctionTimes } from '../src/lib/auction.ts'
import { buildVehicleIndex } from '../src/lib/vehicle-index.ts'
import { applyFiltersAndSort } from '../src/lib/vehicles.ts'

const here = dirname(fileURLToPath(import.meta.url))
const datasets = [
  { label: '200 vehicles (seed)',   path: resolve(here, '../public/data/vehicles.json') },
  { label: '20,000 vehicles (large)', path: resolve(here, '../public/data/vehicles-large.json') },
]

function now() { return performance.now() }

function measure<T>(fn: () => T, runs = 5): { median: number; value: T } {
  const samples: number[] = []
  let last!: T
  for (let i = 0; i < runs; i += 1) {
    const start = now()
    last = fn()
    samples.push(now() - start)
  }
  samples.sort((a, b) => a - b)
  return { median: samples[Math.floor(samples.length / 2)]!, value: last }
}

const EMPTY_OVERRIDES = new Map<string, number>()

function defaultFilters() {
  return {
    search: '',
    minPrice: null, maxPrice: null, minGrade: null,
    bodyStyles: [], drivetrains: [], provinces: [],
    transmissions: [], fuelTypes: [], titleStatuses: [],
    hasBuyNow: null,
    sort: 'time-remaining' as const,
  }
}

for (const { label, path } of datasets) {
  console.log(`\n=== ${label} ===`)

  const readRes = measure(() => JSON.parse(readFileSync(path, 'utf-8')) as Vehicle[], 3)
  const raw = readRes.value
  console.log(`read+parse JSON:             ${readRes.median.toFixed(2)} ms  (${raw.length} records)`)

  const normRes = measure(() => normalizeAuctionTimes(raw), 3)
  const normalized = normRes.value as (Vehicle & { auction_end: string })[]
  console.log(`normalizeAuctionTimes:       ${normRes.median.toFixed(2)} ms`)

  const idxRes = measure(() => buildVehicleIndex(normalized), 3)
  const index = idxRes.value
  console.log(`buildVehicleIndex:           ${idxRes.median.toFixed(2)} ms`)

  // No-op filters: pays the cost of iterating all ids + sort.
  const noFilterRes = measure(
    () => applyFiltersAndSort(index, defaultFilters(), EMPTY_OVERRIDES),
    7,
  )
  console.log(`filter (no predicates):      ${noFilterRes.median.toFixed(2)} ms → ${noFilterRes.value.length} results`)

  // Text search keystroke scenario — single categorical + search.
  const textRes = measure(
    () => applyFiltersAndSort(index, { ...defaultFilters(), search: 'ford' }, EMPTY_OVERRIDES),
    7,
  )
  console.log(`filter (text="ford"):        ${textRes.median.toFixed(2)} ms → ${textRes.value.length} results`)

  // Multi-facet (body + province + min grade) — representative "real" filter set.
  const facetRes = measure(
    () => applyFiltersAndSort(
      index,
      {
        ...defaultFilters(),
        bodyStyles: ['SUV'],
        provinces: ['Ontario'],
        minGrade: 3.5,
        sort: 'bid-desc',
      },
      EMPTY_OVERRIDES,
    ),
    7,
  )
  console.log(`filter (SUV+ON+grade≥3.5):   ${facetRes.median.toFixed(2)} ms → ${facetRes.value.length} results`)

  // Worst case — heavy sort over large subset.
  const heavyRes = measure(
    () => applyFiltersAndSort(index, { ...defaultFilters(), sort: 'bid-desc' }, EMPTY_OVERRIDES),
    5,
  )
  console.log(`filter (all+bid-desc sort):  ${heavyRes.median.toFixed(2)} ms → ${heavyRes.value.length} results`)
}
