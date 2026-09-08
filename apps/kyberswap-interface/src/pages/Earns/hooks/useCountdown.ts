import { useEffect, useState } from 'react'

const nowInSeconds = () => Math.floor(Date.now() / 1000)

export const formatDuration = (seconds: number) => {
  if (seconds <= 0) return '--'

  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0 || d > 0) parts.push(`${h}h`)
  parts.push(`${m}m`)
  parts.push(`${s}s`)

  return parts.join(' : ')
}

/**
 * Seconds left until `targetTimestamp` (unix seconds), ticking once a second and stopping at zero.
 * Counting to an absolute instant rather than from a duration keeps the display correct when the
 * component remounts or the tab was in the background.
 */
export const useCountdown = (targetTimestamp?: number) => {
  const [remaining, setRemaining] = useState(() =>
    targetTimestamp ? Math.max(targetTimestamp - nowInSeconds(), 0) : 0,
  )

  useEffect(() => {
    if (!targetTimestamp) {
      setRemaining(0)
      return
    }

    const tick = () => setRemaining(Math.max(targetTimestamp - nowInSeconds(), 0))
    tick()

    const interval = setInterval(() => {
      const next = Math.max(targetTimestamp - nowInSeconds(), 0)
      setRemaining(next)
      if (next <= 0) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [targetTimestamp])

  return { remaining, label: formatDuration(remaining) }
}

export default useCountdown
