import { useEffect, useState } from 'react'

/**
 * How long a balance may stay unknown before a row stops claiming to be loading it. Long enough for
 * a slow answer to arrive, short enough that nobody watches a placeholder wondering what it means.
 */
const BALANCE_WAIT_MS = 15_000

/**
 * Whether a balance that is still unknown is worth showing as loading. Every new value from the
 * source restarts the wait, so a source that keeps answering keeps its rows on a loader; one that
 * stops answering ends it, and the row can say the balance is unknown rather than spin for good.
 */
export const useBalanceWait = (progress: unknown, enabled = true): boolean => {
  const [waiting, setWaiting] = useState(enabled)

  useEffect(() => {
    if (!enabled) {
      setWaiting(false)
      return
    }
    setWaiting(true)
    const timer = setTimeout(() => setWaiting(false), BALANCE_WAIT_MS)
    return () => clearTimeout(timer)
  }, [progress, enabled])

  return waiting
}
