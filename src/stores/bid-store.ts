import { create } from 'zustand'
import type { BidRecord } from '@/types/vehicle'

export interface BidState {
  /** Overrides on top of original JSON data — keyed by vehicleId */
  bids: Record<string, {
    currentBid: number
    bidCount: number
    isUserHighBidder: boolean
    isSold: boolean
  }>

  /** Session bid history per vehicle */
  bidHistory: Record<string, BidRecord[]>

  /** Place a bid — updates store optimistically */
  placeBid: (vehicleId: string, amount: number) => void

  /** Buy now — marks as sold */
  buyNow: (vehicleId: string, price: number) => void

  /** Get the effective current bid (merges JSON data with local overrides) */
  getEffectiveBid: (vehicleId: string, originalBid: number | null) => number | null

  /** Get merged state for a vehicle */
  getBidState: (
    vehicleId: string,
    originalBid: number | null,
    originalCount: number
  ) => {
    currentBid: number | null
    bidCount: number
    isUserHighBidder: boolean
    isSold: boolean
  }

  getHistory: (vehicleId: string) => BidRecord[]
}

export const useBidStore = create<BidState>((set, get) => ({
  bids: {},
  bidHistory: {},

  placeBid: (vehicleId, amount) => {
    set(state => {
      const existing = state.bids[vehicleId]
      const newBid: BidRecord = {
        vehicleId,
        amount,
        timestamp: Date.now(),
        type: 'bid',
      }
      return {
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
      }
    })
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

  getEffectiveBid: (vehicleId, originalBid) => {
    const override = get().bids[vehicleId]
    if (override) return override.currentBid
    return originalBid
  },

  getBidState: (vehicleId, originalBid, originalCount) => {
    const override = get().bids[vehicleId]
    if (override) {
      return {
        currentBid: override.currentBid,
        bidCount: originalCount + (override.bidCount),
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
  },

  getHistory: (vehicleId) => get().bidHistory[vehicleId] ?? [],
}))
