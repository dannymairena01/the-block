import type { Vehicle } from '@/types/vehicle'

const AUCTION_DURATION_MS = 4 * 60 * 60 * 1000 // 4 hours

/**
 * Linearly maps all auction_start times from the original dataset distribution
 * to a window around "now" so the prototype always has a live feel:
 *   - Some auctions already ended
 *   - Some ending soon (urgency!)
 *   - Some active / mid-auction
 *   - Some upcoming
 */
export function normalizeAuctionTimes(vehicles: Vehicle[]): Vehicle[] {
  const now = Date.now()
  const n = vehicles.length
  const starts = new Array<number>(n)

  // Single pass to parse + track min/max. Avoids Math.min(...arr) / Math.max(...arr),
  // which constructs a huge argument list (RangeError risk past engine limits,
  // and slower even when it works).
  let earliest = Infinity
  let latest = -Infinity
  for (let i = 0; i < n; i += 1) {
    const t = new Date(vehicles[i]!.auction_start).getTime()
    starts[i] = t
    if (t < earliest) earliest = t
    if (t > latest) latest = t
  }
  if (n === 0) return []
  const srcSpan = latest - earliest

  // Window: started 3 hours ago → starting 10 hours from now
  const winStart = now - 3 * 60 * 60 * 1000
  const winEnd = now + 10 * 60 * 60 * 1000
  const winSpan = winEnd - winStart

  const out: Vehicle[] = new Array(n)
  for (let i = 0; i < n; i += 1) {
    const vehicle = vehicles[i]!
    const ratio = srcSpan > 0 ? (starts[i]! - earliest) / srcSpan : 0
    const newStart = winStart + ratio * winSpan
    const newEnd = newStart + AUCTION_DURATION_MS
    out[i] = {
      ...vehicle,
      auction_start: new Date(newStart).toISOString(),
      auction_end: new Date(newEnd).toISOString(),
    } as Vehicle & { auction_end: string }
  }
  return out
}

export type AuctionStatus =
  | { status: 'upcoming'; startsIn: number }
  | { status: 'active'; timeRemaining: number }
  | { status: 'ending-soon'; timeRemaining: number }
  | { status: 'ended' }
  | { status: 'sold' }

export function getAuctionStatus(
  auctionStart: string,
  auctionEnd: string
): AuctionStatus {
  const now = Date.now()
  const start = new Date(auctionStart).getTime()
  const end = new Date(auctionEnd).getTime()

  if (now < start) return { status: 'upcoming', startsIn: start - now }
  if (now >= end) return { status: 'ended' }

  const remaining = end - now
  if (remaining <= 15 * 60 * 1000)
    return { status: 'ending-soon', timeRemaining: remaining }
  return { status: 'active', timeRemaining: remaining }
}
