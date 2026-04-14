import { useCountdown } from '@/hooks/use-countdown'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

const urgencyStyles = {
  normal: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400 animate-urgency',
}

const urgencyBg = {
  normal: 'bg-emerald-400/10 border-emerald-400/20',
  warning: 'bg-amber-400/10 border-amber-400/20',
  critical: 'bg-red-400/10 border-red-400/20',
}

interface CountdownTimerProps {
  targetDate: string
  prefix?: string
  compact?: boolean
}

export function CountdownTimer({ targetDate, prefix = '', compact = false }: CountdownTimerProps) {
  const { totalMs, isExpired, urgency } = useCountdown(targetDate)

  if (isExpired) {
    return (
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        Auction Ended
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-semibold border rounded-md',
        compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        urgencyStyles[urgency],
        urgencyBg[urgency]
      )}
    >
      <Clock size={compact ? 10 : 12} className="shrink-0" />
      {prefix && <span className="font-sans font-medium text-xs opacity-75">{prefix}</span>}
      {formatDuration(totalMs)}
    </span>
  )
}

/** Variant for upcoming auctions */
export function StartTimer({ targetDate }: { targetDate: string }) {
  const { totalMs, isExpired } = useCountdown(targetDate)

  if (isExpired) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-md border"
      style={{
        color: 'var(--color-text-secondary)',
        background: 'var(--color-surface-3)',
        borderColor: 'var(--color-surface-border)',
      }}
    >
      <Clock size={10} className="shrink-0" />
      Starts in {formatDuration(totalMs)}
    </span>
  )
}
