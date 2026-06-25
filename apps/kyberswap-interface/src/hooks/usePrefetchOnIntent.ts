import { useCallback, useEffect, useRef } from 'react'

interface Options {
  /** Delay (ms) before firing; cancelled if the pointer leaves first — avoids prefetch on fast pass-over. */
  delay?: number
}

/**
 * Fire `prefetch` on user-intent toward an element (pointer hover, touch, or keyboard focus). Used to
 * warm a destination route's lazy JS chunk and/or its RTK Query data before the user clicks, so the
 * click→render path skips the chunk download and the data spinner.
 *
 * Dedup is the CALLBACK's responsibility (`import()` is cached; the data prefetchers in `utils/prefetch`
 * guard with a Set), so this hook does NOT latch "once per mount" — that's deliberate: a callback that
 * no-op'd earlier (e.g. it needed a wallet that wasn't connected yet) must be able to succeed once its
 * inputs become valid. Spread the returned handlers onto the link/row element.
 */
export default function usePrefetchOnIntent(prefetch: (() => void) | undefined, { delay = 0 }: Options = {}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fire = useCallback(() => {
    timer.current = undefined
    prefetch?.()
  }, [prefetch])

  const start = useCallback(() => {
    if (!prefetch || timer.current) return // a delayed fire is already pending
    if (delay > 0) timer.current = setTimeout(fire, delay)
    else fire()
  }, [delay, fire, prefetch])

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = undefined
    }
  }, [])

  // Clear any pending timer if the element unmounts before it fires.
  useEffect(() => cancel, [cancel])

  return {
    onMouseEnter: start,
    onMouseLeave: cancel,
    onFocus: start,
    onBlur: cancel,
    onTouchStart: start,
  }
}
