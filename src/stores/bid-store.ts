import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { BidRecord } from '@/types/vehicle'

export interface BidOverride {
  currentBid: number
  bidCount: number
  isUserHighBidder: boolean
  isSold: boolean
}

export interface BidState {
  /** Overrides on top of original JSON data — keyed by vehicleId */
  bids: Record<string, BidOverride>

  /** Session bid history per vehicle */
  bidHistory: Record<string, BidRecord[]>

  /** Place a bid — updates store optimistically. Returns false if stale. */
  placeBid: (
    vehicleId: string,
    amount: number,
    expectedCurrentBid: number | null,
  ) => { ok: true } | { ok: false; reason: 'stale'; currentBid: number }

  /** Buy now — marks as sold */
  buyNow: (vehicleId: string, price: number) => void

  getHistory: (vehicleId: string) => BidRecord[]
}

export const useBidStore = create<BidState>((set, get) => ({
  bids: {},
  bidHistory: {},

  placeBid: (vehicleId, amount, expectedCurrentBid) => {
    const existing = get().bids[vehicleId]
    const observed =
      existing?.currentBid ?? expectedCurrentBid ?? null
    if (
      expectedCurrentBid !== null &&
      observed !== null &&
      observed !== expectedCurrentBid
    ) {
      return { ok: false, reason: 'stale', currentBid: observed }
    }

    const newBid: BidRecord = {
      vehicleId,
      amount,
      timestamp: Date.now(),
      type: 'bid',
    }
    set(state => ({
      bids: {
        ...state.bids,
        [vehicleId]: {
          currentBid: amount,
          bidCount: (existing?.bidCount ?? 0) + 1,
          isUserHighBidder: true,
          isSold: false,
        },
      },
      bidHistory: {
        ...state.bidHistory,
        [vehicleId]: [newBid, ...(state.bidHistory[vehicleId] ?? [])],
      },
    }))
    return { ok: true }
  },

  buyNow: (vehicleId, price) => {
    set(state => {
      const existing = state.bids[vehicleId]
      const record: BidRecord = {
        vehicleId,
        amount: price,
        timestamp: Date.now(),
        type: 'buy-now',
      }
      return {
        bids: {
          ...state.bids,
          [vehicleId]: {
            currentBid: price,
            bidCount: (existing?.bidCount ?? 0) + 1,
            isUserHighBidder: true,
            isSold: true,
          },
        },
        bidHistory: {
          ...state.bidHistory,
          [vehicleId]: [record, ...(state.bidHistory[vehicleId] ?? [])],
        },
      }
    })
  },

  getHistory: (vehicleId) => get().bidHistory[vehicleId] ?? [],
}))

/**
 * Subscribe a component to ONLY one vehicle's bid override. Re-renders only
 * when that vehicle's override changes — not when any other vehicle is bid on.
 */
export function useVehicleBidState(
  vehicleId: string,
  originalBid: number | null,
  originalCount: number,
) {
  const override = useBidStore(s => s.bids[vehicleId])
  if (override) {
    return {
      currentBid: override.currentBid,
      bidCount: originalCount + override.bidCount,
      isUserHighBidder: override.isUserHighBidder,
      isSold: override.isSold,
    }
  }
  return {
    currentBid: originalBid,
    bidCount: originalCount,
    isUserHighBidder: false,
    isSold: false,
  }
}

/**
 * Snapshot of effective current-bid overrides keyed by vehicle id, for use in
 * filter/sort pipelines. Re-renders only when the set of overrides changes.
 */
export function useBidOverridesSnapshot(): Map<string, number> {
  const bids = useBidStore(
    useShallow(s => s.bids),
  )
  return useMemo(() => {
    const map = new Map<string, number>()
    for (const [id, override] of Object.entries(bids)) {
      map.set(id, override.currentBid)
    }
    return map
  }, [bids])
}
