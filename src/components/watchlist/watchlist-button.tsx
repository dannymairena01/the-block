import { Bookmark } from 'lucide-react'
import { useWatchlistStore } from '@/stores/watchlist-store'
import { cn } from '@/lib/utils'

interface WatchlistButtonProps {
  vehicleId: string
  size?: 'sm' | 'md'
  className?: string
}

export function WatchlistButton({ vehicleId, size = 'sm', className }: WatchlistButtonProps) {
  // Scope the subscription to just "is this vehicle watched?" and the stable
  // `toggle` action — otherwise every card button re-renders on any watchlist
  // change, which gets expensive at 20k with ~40 buttons visible.
  const watched = useWatchlistStore(s => s.watchedIds.has(vehicleId))
  const toggle = useWatchlistStore(s => s.toggle)

  return (
    <button
      id={`watchlist-${vehicleId}`}
      className={cn(
        'btn btn-ghost transition-fast rounded-full',
        size === 'sm' ? 'p-1.5' : 'p-2',
        watched && 'text-amber-400',
        className
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(vehicleId)
      }}
      aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      title={watched ? 'Remove from watchlist' : 'Save to watchlist'}
    >
      <Bookmark
        size={size === 'sm' ? 15 : 18}
        className={cn('transition-fast', watched && 'fill-amber-400')}
      />
    </button>
  )
}
