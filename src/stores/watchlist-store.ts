import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface WatchlistState {
  watchedIds: Set<string>
  toggle: (vehicleId: string) => void
  isWatched: (vehicleId: string) => boolean
  count: () => number
  clear: () => void
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchedIds: new Set<string>(),

      toggle: (id) =>
        set(state => {
          const next = new Set(state.watchedIds)
          next.has(id) ? next.delete(id) : next.add(id)
          return { watchedIds: next }
        }),

      isWatched: (id) => get().watchedIds.has(id),

      count: () => get().watchedIds.size,

      clear: () => set({ watchedIds: new Set() }),
    }),
    {
      name: 'the-block-watchlist',
      storage: createJSONStorage(() => localStorage, {
        replacer: (_, value) =>
          value instanceof Set ? [...value] : value,
        reviver: (key, value) =>
          key === 'watchedIds' ? new Set(value as string[]) : value,
      }),
    }
  )
)
