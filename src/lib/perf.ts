/**
 * Lightweight, labelled performance logger for the scalability audit.
 *
 * Emits `[perf] <label>: <duration>ms` lines to the console at key moments
 * identified in SCALABILITY_AUDIT.md so improvements can be quantified.
 *
 * Disable via `VITE_PERF_LOG=false`; default is on in development / preview.
 */

const ENABLED =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_PERF_LOG !== 'false'

type Marks = Map<string, number>
const marks: Marks = new Map()

/** Start (or restart) a named timer. */
export function perfStart(label: string) {
  if (!ENABLED) return
  marks.set(label, performance.now())
}

/**
 * Stop a named timer and log the elapsed wall time. Returns the elapsed ms
 * (or `null` if the timer was never started). Extra context is appended
 * to the log line for quick scanning.
 */
export function perfEnd(label: string, context?: string | number): number | null {
  if (!ENABLED) return null
  const start = marks.get(label)
  if (start === undefined) return null
  const elapsed = performance.now() - start
  marks.delete(label)
  const suffix = context !== undefined ? ` (${context})` : ''
  console.log(`[perf] ${label}: ${elapsed.toFixed(2)}ms${suffix}`)
  return elapsed
}

/** One-shot timer — runs fn synchronously, logs the elapsed time. */
export function perfMeasure<T>(label: string, fn: () => T, context?: string | number): T {
  if (!ENABLED) return fn()
  const start = performance.now()
  try {
    return fn()
  } finally {
    const elapsed = performance.now() - start
    const suffix = context !== undefined ? ` (${context})` : ''
    console.log(`[perf] ${label}: ${elapsed.toFixed(2)}ms${suffix}`)
  }
}

/** Fire-and-forget log helper for non-duration metrics (node counts etc). */
export function perfLog(label: string, value: string | number) {
  if (!ENABLED) return
  console.log(`[perf] ${label}: ${value}`)
}
