import { useState, useEffect, useRef } from 'react'

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

export function useCountdown(targetDate: string | number): CountdownResult {
  const targetMs =
    typeof targetDate === 'string'
      ? new Date(targetDate).getTime()
      : targetDate

  const [now, setNow] = useState(Date.now)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (targetMs - Date.now() <= 0) {
      setNow(Date.now())
      return
    }

    intervalRef.current = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= targetMs && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [targetMs])

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
