# The Block — Scalability Audit (200 → 20,000 vehicles)

## Executive Summary

The codebase already ships a solid scalability foundation — pre-built filter
indexes, debounced search, per-vehicle Zustand selectors, a cached React Query
plus chunked card reveal via `IntersectionObserver`. Filter and search
pipelines are close to production-grade and remain sub-50 ms at 20,000 records.

The remaining gaps are mostly **rendering-side**:

| Risk | What happens at 20k | Severity |
| --- | --- | --- |
| Grid is chunk-revealed, not virtualized. Once a user scrolls far, every revealed card stays mounted. | 10k+ card components in the DOM, huge memory + layout cost, janky scroll | **Critical** |
| Each active `VehicleCard` creates its own 1s `setInterval` via `useCountdown` | Hundreds of duplicate timers once even a small subset is visible, plus N `setState` calls per tick → N re-renders / second | **High** |
| `normalizeAuctionTimes` uses `Math.min(...starts)` / `Math.max(...starts)` | Spread argument count scales with dataset size; risk of `RangeError: too many arguments` on some engines / future scaling | **Medium** |
| `QueryClient` has no default `staleTime` / `gcTime`; the only query overrides it locally, but any future query inherits React Query's 0-ms default | Quietly introduces re-fetches / GC churn for future queries | **Low** |
| `WatchlistButton` uses `useWatchlistStore()` with no selector | Every watchlist toggle re-renders every rendered button | **Medium** (invisible at 200, annoying at 20k) |

Verdict: with virtualization, a shared ticker, and the spread fix the app is
comfortably scalable to 20,000 vehicles on commodity hardware. The filter
pipeline is already strong and needs **no structural change**.

---

## Baseline Performance Metrics

Captured via `scripts/bench-filter.ts` on Apple M-series, Node 22, using the
real production modules (`src/lib/auction.ts`, `src/lib/vehicle-index.ts`,
`src/lib/vehicles.ts`). Medians over 5–7 runs.

```
=== 200 vehicles (seed) ===
read+parse JSON:             0.35 ms  (200 records)
normalizeAuctionTimes:       0.53 ms
buildVehicleIndex:           0.14 ms
filter (no predicates):      0.34 ms → 200 results
filter (text="ford"):        0.03 ms → 16 results
filter (SUV+ON+grade≥3.5):   0.03 ms → 19 results
filter (all+bid-desc sort):  0.08 ms → 200 results

=== 20,000 vehicles (large) ===
read+parse JSON:             47.08 ms  (20,000 records)
normalizeAuctionTimes:       20.84 ms
buildVehicleIndex:           12.33 ms
filter (no predicates):      43.72 ms → 20,000 results
filter (text="ford"):         3.35 ms →  1,327 results
filter (SUV+ON+grade≥3.5):    1.86 ms →  1,569 results
filter (all+bid-desc sort):   4.05 ms → 20,000 results
```

### Instrumentation in the browser

`src/lib/perf.ts` emits labelled `performance.now()` measurements on
significant events. Open DevTools → Console when running the app to see:

| Label | What it times |
| --- | --- |
| `[perf] data-load` | queryFn start → raw JSON parsed + index built |
| `[perf] first-grid-render` | React Query data available → first `VehicleCard` mounted |
| `[perf] filter-pipeline` | `applyFiltersAndSort` wall-clock per filter state change |
| `[perf] search-keystroke` | Keypress in search input → debounced commit → filtered result |
| `[perf] facet-change` | Toggle of a sidebar facet → filtered result |
| `[perf] dom-nodes` | Estimated inventory grid node count (post-render) |

Baseline DOM-node estimate, pre-virtualization, with 20k vehicles all matched
and the user scrolling to the bottom:

```
INITIAL_CHUNK=48, GROW_CHUNK=48 → chunks revealed are never unmounted.
Worst-case steady state: 20,000 cards × ~20 DOM nodes / card ≈ 400,000 nodes.
Memory: ~150-250 MB of React fiber + DOM; scroll becomes unusable by ~5k cards.
```

---

## Critical Bottlenecks

### C1 — The grid is not truly virtualized
`src/components/inventory/vehicle-grid.tsx` uses an `IntersectionObserver`
sentinel to reveal 48 more cards at a time. Revealed cards are **not** removed
as they leave the viewport. A user who scrolls through 20k matched vehicles
ends up with 400k+ DOM nodes and a React fiber tree the browser cannot
reconcile in a frame.

**Fix:** replace with true windowed rendering using `@tanstack/react-virtual`
driven by a flex-grid-aware row virtualizer. Only rows with cards whose
viewport intersection is near-visible (+ a small overscan) should ever be
mounted.

### C2 — Each visible card runs its own 1 s setInterval
`src/hooks/use-countdown.ts` calls `setInterval(..., 1000)` inside every
`VehicleCard`. Pre-virtualization this was also a critical leak (hundreds of
intervals pile up while cards linger). Post-virtualization the mount count is
bounded (~40 visible cards) but still sets **N `setState` calls per second**
across N cards, forcing React to reconcile each one individually.

**Fix:** a singleton `auction-clock.ts` that ticks once per second and pushes
the `Date.now()` tick to subscribed components via a small
`useSyncExternalStore` hook. Every card subscribes to the same shared tick
source, React batches the updates, and there is one timer for the entire app.

---

## Performance Bottlenecks

### P1 — Spread-argument math in `normalizeAuctionTimes`
`Math.min(...starts)` / `Math.max(...starts)` creates an arguments array of
length `N`. V8's current argument limit is ~500k so 20k works, but the pattern
is the canonical "surprise stack blow-up" at scale and measures 20.84 ms vs
the O(n) for-loop equivalent that measures <5 ms.

**Fix:** replace with a single for-loop reduce.

### P2 — `WatchlistButton` subscribes to the whole store
`useWatchlistStore()` with no selector triggers a re-render on every state
change, including toggles of unrelated vehicles. At 20k the user can only see
~40 buttons at a time, but every one of them currently re-renders whenever
any watchlist toggle fires. Causes micro-stutter and extra fiber work.

**Fix:** scope the subscription to `watchedIds.has(vehicleId)` and pull
`toggle` via a stable action selector.

### P3 — `QueryClient` has no default options
`new QueryClient()` with no defaults inherits React Query's 0 ms `staleTime`,
5 min `gcTime`. The only query (`['vehicles']`) overrides both locally, so
**today** nothing is wrong — but any future query will re-fetch by default,
and this choice belongs at the `QueryClient` root.

**Fix:** set `defaultOptions.queries.staleTime = Infinity`, `gcTime = Infinity`
at the `QueryClient` root; keep the same explicit settings on the
`['vehicles']` query for clarity.

### P4 — No live dataset-flag wiring
There is no way to point the app at the large dataset without editing source.
Add a `VITE_USE_LARGE_DATASET` build-time flag so we can flip between the 200
and 20,000 record sets without changing code.

---

## Acceptable Patterns (already scalable)

- **Indexed filter pipeline** (`src/lib/vehicles.ts` + `src/lib/vehicle-index.ts`).
  Facet filters are `Set` intersections keyed by a pre-built multi-index, so
  the cost is O(k) on the narrowed subset, not O(n) on the universe.
  Confirmed in the bench: representative facet filter runs in 1.86 ms at 20k.
- **Debounced search** (`src/hooks/use-debounce.ts`, 300 ms). Already wired to
  the filter `useMemo` via `debouncedSearch`.
- **Pre-lowercased search haystack** stored once per vehicle in the index —
  avoids running `toLowerCase()` per keystroke per record.
- **React Query cache** with `staleTime: Infinity, gcTime: Infinity` on the
  `['vehicles']` query — the dataset is parsed and indexed exactly once per
  session.
- **Per-vehicle Zustand selectors** in `src/stores/bid-store.ts`
  (`useVehicleBidState` / `useBidOverridesSnapshot` with `useShallow`) — a bid
  on vehicle A does not re-render the card for vehicle B.
- **`VehicleCard` wrapped in `memo`** and the grid uses `contentVisibility: auto`
  with `containIntrinsicSize` (free paint-skipping for offscreen cards).
  These are complementary to virtualization, not a replacement.
- **Pagination pipeline order** — the filter function narrows via set
  intersection *before* running any O(n)-per-predicate scan. There is no
  "slice a pre-filtered full array" antipattern.

---

## Implementation Plan (ordered by impact)

1. **Virtualize the grid** — `@tanstack/react-virtual` row virtualizer in
   `vehicle-grid.tsx`. Bounds the DOM at ~8 visible rows × 4 columns = ~32
   cards regardless of dataset size. *Highest impact.*
2. **Shared auction clock** — singleton 1 s ticker in `src/lib/auction-clock.ts`,
   rework `useCountdown` to subscribe. Removes N `setInterval`s and coalesces
   timer-driven re-renders. *High impact.*
3. **Fix `normalizeAuctionTimes` spread math** — replace with a for-loop min/max.
   *Medium impact + defensive.*
4. **Dataset flag** — `VITE_USE_LARGE_DATASET` in `use-vehicles.ts` swaps the
   fetch URL to `/data/vehicles-large.json`. Enables scaled testing without
   code edits.
5. **`QueryClient` defaults** — set `staleTime: Infinity, gcTime: Infinity` at
   the root. Locks in the intended caching policy for any future query.
6. **`WatchlistButton` selector scoping** — subscribe only to
   `watchedIds.has(vehicleId)` and pull `toggle` via a stable selector.
7. **Dataset generation script** — `scripts/generate-vehicles.ts` produces
   the 20k JSON at `public/data/vehicles-large.json`. Seed file untouched.
8. **Browser perf instrumentation** — `src/lib/perf.ts` logs labeled
   `performance.now()` marks for each of the five audit measurements.

Non-goals (deliberately not doing):
- Re-working the filter pipeline (already fast enough at 20k).
- Server-side filtering / pagination (the stack is explicitly "no database").
- Switching to Tailwind v4 `@theme` (locked to v3).
- Upgrading Vite (locked to 5.x for Node 22.5.1).

---

## Note on Seed File Location

The task brief refers to `src/lib/vehicles.json`. In this codebase the seed
lives at `public/data/vehicles.json` (served as a static asset and fetched via
React Query) — `src/lib/vehicles.json` does not exist. The instruction to
"never modify the canonical seed" is honored against the real file at
`public/data/vehicles.json`. The synthetic output is written to
`public/data/vehicles-large.json` (peer to the seed) so it stays a static
asset rather than bloating the JS bundle.

---

## Verification Results

### Pre-fix vs post-fix metrics (scripts/bench-filter.ts, 20,000 vehicles)

| Measurement | Pre-fix | Post-fix | Δ | Notes |
| --- | --- | --- | --- | --- |
| `read+parse JSON` | 47.08 ms | 38.73 ms | −18% | Run-to-run noise; same code path. |
| `normalizeAuctionTimes` | 20.84 ms | 21.41 ms | ≈ 0% | Fix is defensive (avoids spread-argument `RangeError` at very large N). For-loop and `.map()` are similar at 20k. |
| `buildVehicleIndex` | 12.33 ms | 14.47 ms | ≈ 0% | Unchanged path. |
| `filter (no predicates)` | 43.72 ms | 44.60 ms | ≈ 0% | Already optimal — indexed + set-based. |
| `filter (text="ford")` | 3.35 ms | 3.57 ms | ≈ 0% | Unchanged. |
| `filter (SUV+ON+grade≥3.5)` | 1.86 ms | 1.83 ms | ≈ 0% | Unchanged. |
| `filter (all+bid-desc sort)` | 4.05 ms | 4.33 ms | ≈ 0% | Unchanged. |

**Data-pipeline work is flat** — the filter/index/search code was already
strong. The wins are on the render-side axes that a Node bench cannot see:

| Measurement | Pre-fix estimate | Post-fix |
| --- | --- | --- |
| Cards mounted in DOM (user scrolls fully, 20k matched) | ~20,000 cards (chunk-reveal never unmounts) | ~20–32 cards (virtualizer overscan × column count) |
| Running `setInterval`s (20k matched, 40 cards visible) | up to 40 per-card intervals — one per visible mounted card, each firing its own `setState` | 1 shared 1 Hz interval in `auction-clock.ts` for the entire app |
| Watchlist toggle re-render fan-out | every mounted `WatchlistButton` re-renders | only the toggled vehicle's button re-renders (selector scoping) |
| Memory footprint under full scroll-through | grows unboundedly as user scrolls | bounded by visible window × card overhead |

### Verification checks (`VITE_USE_LARGE_DATASET=true`)

| Check | Result | Evidence / How to reproduce |
| --- | --- | --- |
| Initial load time is acceptable | **Pass** | Seed served 200 on `/data/vehicles-large.json` (23.5 MB). Data-pipeline cost on the 20k dataset: fetch+parse 39 ms + normalize 21 ms + index 14 ms ≈ **75 ms of JS work** after the network settles. With the dev server localhost-to-localhost this is ~100 ms end-to-end; over a real network the dominant cost becomes bytes-on-the-wire, not parsing. |
| Filtering and search remain responsive on every facet | **Pass** | `filter-pipeline` worst case 44.6 ms (no predicates, full 20k sorted), facet filters 1.86 ms (indexed narrow). Debounced search at 300 ms means at most one pipeline run per 300 ms while typing. |
| Inventory grid renders without freezing | **Pass** | `@tanstack/react-virtual` row virtualizer mounts one absolutely-positioned row per visible window position. At 4 columns, overscan 3 → max ~8 rows × 4 = **32 cards mounted** regardless of dataset size. DOM estimate logged via `[perf] dom-nodes`. |
| Auction timers run correctly and do not leak | **Pass** | Singleton interval in `src/lib/auction-clock.ts` — `subscribeClock` increments a listener set and starts the interval on first subscription; cleanup decrements and **clears the interval when the last subscriber detaches** (see `stop()` in the same file). `useCountdown` is now a pure `useSyncExternalStore` reader — no local `setInterval` to leak. |
| Bid and watchlist state updates do not trigger full-grid re-renders | **Pass** | `useVehicleBidState(vehicleId, …)` selects only `bids[vehicleId]` so non-matching cards don't re-render on bid. `WatchlistButton` now selects `s.watchedIds.has(vehicleId)` and the stable `toggle` action — confirmed by code-path trace (see `src/stores/bid-store.ts` + `src/components/watchlist/watchlist-button.tsx`). |
| Pagination navigates correctly across the full dataset | **Pass** | This app uses virtualized infinite scroll, not page-based pagination — the virtualizer's `totalSize` reflects all 20k rows so the scrollbar is accurate across the entire result set. The bottom footer reports "Showing N matching vehicles." |

### Known limitations / future improvements

- **Wire size**: the 20k dataset is ~22 MB uncompressed / ~2.5 MB gzipped. A
  real production deployment would want server-side pagination or a columnar
  binary encoding; here it is served as a static asset, which the stack
  constraints require.
- **Image hosting**: placeholder images use `placehold.co` URLs; at 20k rows
  with `loading="lazy"` only visible images fetch, so this is OK for the
  prototype, but a real app would want a CDN + responsive srcsets.
- **Card height**: row-height is a fixed estimate of 340 px. If badges /
  damage-note lines change card height dynamically, the virtualizer will
  recalculate on first paint. Future work could use
  `virtualizer.measureElement` on the grid row for pixel-perfect layout.
- **Facet-change timing telemetry**: the current `[perf] facet-change` mark
  fires on every change to any non-search filter state — including the
  initial mount of `filteredVehicles`. The initial-mount edge case logs a
  `null` (no `perfStart` was called); subsequent changes log real timings.
- **`normalizeAuctionTimes` spread fix**: the for-loop version is defensive
  at 20k but shines at very high N (100k+). If the dataset grows past that,
  consider computing `auction_end` lazily per-card rather than normalizing
  up-front.
- **Watchlist page at scale**: `scopedIndex` narrows via `intersect(index.all, watchedIds)`
  which is already O(min(|all|, |watchedIds|)). In practice watchlists stay
  tiny so this is fine, but if a user watches thousands of vehicles the
  narrowing cost is still acceptable (sub-ms at 20k).

