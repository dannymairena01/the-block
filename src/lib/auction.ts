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
  const starts = vehicles.map(v => new Date(v.auction_start).getTime())
  const earliest = Math.min(...starts)
  const latest = Math.max(...starts)
  const srcSpan = latest - earliest

  // Window: started 3 hours ago → starting 10 hours from now
  const winStart = now - 3 * 60 * 60 * 1000
  const winEnd = now + 10 * 60 * 60 * 1000
  const winSpan = winEnd - winStart

  return vehicles.map((vehicle, i) => {
    const ratio = srcSpan > 0 ? (starts[i] - earliest) / srcSpan : 0
    const newStart = winStart + ratio * winSpan
    const newEnd = newStart + AUCTION_DURATION_MS
    return {
      ...vehicle,
      auction_start: new Date(newStart).toISOString(),
      auction_end: new Date(newEnd).toISOString(),
    } as Vehicle & { auction_end: string }
  })
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
