/**
 * Single app-wide 1Hz clock that broadcasts `Date.now()` to subscribed
 * components. Replaces the per-card `setInterval` pattern that was previously
 * in `useCountdown` — with virtualized rendering we still only mount a few
 * dozen cards at a time, but every mounted countdown used to install its own
 * timer and its own `setState` call per tick. That scales badly and wastes
 * render work.
 *
 * Exported as a subscribable snapshot store so it plays nicely with
 * `useSyncExternalStore` in `use-countdown.ts`.
 */

type Listener = () => void

let intervalId: ReturnType<typeof setInterval> | null = null
let snapshot: number = Date.now()
const listeners = new Set<Listener>()

function start() {
  if (intervalId !== null) return
  intervalId = setInterval(() => {
    snapshot = Date.now()
    for (const listener of listeners) listener()
  }, 1000)
}

function stop() {
  if (intervalId === null) return
  clearInterval(intervalId)
  intervalId = null
}

export function subscribeClock(listener: Listener): () => void {
  listeners.add(listener)
  if (listeners.size === 1) start()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}

/** Snapshot is updated on each tick — reading it does not start the clock. */
export function getClockSnapshot(): number {
  return snapshot
}

/** `useSyncExternalStore` ignores SSR in this SPA; simple constant works. */
export function getClockServerSnapshot(): number {
  return snapshot
}
