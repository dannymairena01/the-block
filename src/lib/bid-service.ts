import type { BidRecord } from '@/types/vehicle'

/**
 * Boundary between UI components and the bid backend.
 *
 * Today this is backed by a Zustand store (client-only, optimistic). When a
 * real server-authoritative bid endpoint lands, swap the implementation of
 * `createLocalBidService` for one that POSTs to the API — components don't
 * change. The `expectedCurrentBid` argument is what lets the server reject
 * stale bids atomically (classic compare-and-set).
 */
export interface BidService {
  placeBid(
    vehicleId: string,
    amount: number,
    expectedCurrentBid: number | null,
  ): Promise<BidResult>
  buyNow(vehicleId: string, price: number): Promise<void>
  getHistory(vehicleId: string): BidRecord[]
}

export type BidResult =
  | { ok: true }
  | { ok: false; reason: 'stale'; currentBid: number }
  | { ok: false; reason: 'too-low'; minNextBid: number }
  | { ok: false; reason: 'ended' }

export interface BidStoreLike {
  placeBid: (
    id: string,
    amount: number,
    expectedCurrentBid: number | null,
  ) => { ok: true } | { ok: false; reason: 'stale'; currentBid: number }
  buyNow: (id: string, price: number) => void
  getHistory: (id: string) => BidRecord[]
}

/** Local, optimistic implementation — will be replaced by a network client. */
export function createLocalBidService(store: BidStoreLike): BidService {
  return {
    async placeBid(vehicleId, amount, expectedCurrentBid) {
      return store.placeBid(vehicleId, amount, expectedCurrentBid)
    },
    async buyNow(vehicleId, price) {
      store.buyNow(vehicleId, price)
    },
    getHistory(vehicleId) {
      return store.getHistory(vehicleId)
    },
  }
}
