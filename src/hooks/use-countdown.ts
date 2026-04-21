import { useSyncExternalStore } from 'react'
import {
  getClockServerSnapshot,
  getClockSnapshot,
  subscribeClock,
} from '@/lib/auction-clock'

type Urgency = 'normal' | 'warning' | 'critical'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isExpired: boolean
  urgency: Urgency
}

/**
 * Subscribes the caller to the shared 1Hz auction clock (see
 * `lib/auction-clock.ts`). React batches updates from a single external
 * store, so N mounted countdowns turn into one tick → one commit, not N.
 */
export function useCountdown(targetDate: string | number): CountdownResult {
  const targetMs =
    typeof targetDate === 'string'
      ? new Date(targetDate).getTime()
      : targetDate

  const now = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getClockServerSnapshot,
  )

  const totalMs = Math.max(0, targetMs - now)
  const totalSeconds = Math.floor(totalMs / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  let urgency: Urgency = 'normal'
  if (totalMs <= 15 * 60 * 1000) urgency = 'critical'
  else if (totalMs <= 60 * 60 * 1000) urgency = 'warning'

  return { days, hours, minutes, seconds, totalMs, isExpired: totalMs <= 0, urgency }
}
