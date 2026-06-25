import { useEffect, useRef, useState } from 'react'

import { cn } from 'utils/cn'

type ScrambleNumberProps = {
  /** Target value. Its formatted string defines the fixed character layout that stays put while scrambling. */
  value: number
  /** Formats the value — e.g. as a currency string. Only the digit characters get scrambled. */
  format: (value: number) => string
  durationMs?: number
  className?: string
  style?: React.CSSProperties
}

const isDigit = (c: string) => c >= '0' && c <= '9'
const randomDigit = () => String(Math.floor(Math.random() * 10))

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Slot-machine style reveal: scrambles the digit positions of the formatted value (random 0-9 cycling)
 * and locks them in left-to-right, settling on the real number. Only digits are swapped (always for other
 * digits) and the string keeps the target's exact length + punctuation positions, so with `tabular-nums`
 * the rendered width never changes — zero layout shift. Honors prefers-reduced-motion (shows value at once).
 */
const ScrambleNumber = ({ value, format, durationMs = 900, className, style }: ScrambleNumberProps) => {
  const formatRef = useRef(format)
  formatRef.current = format

  // Start from the target string with every digit zeroed, so the width equals the final width from frame 1.
  const [display, setDisplay] = useState(() => format(value).replace(/\d/g, '0'))
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const final = formatRef.current(value)
    const digitIndices: number[] = []
    for (let i = 0; i < final.length; i++) if (isDigit(final[i])) digitIndices.push(i)

    if (prefersReducedMotion() || digitIndices.length === 0) {
      setDisplay(final)
      return
    }

    const chars = final.split('')
    let startTs: number | undefined
    const tick = (now: number) => {
      if (startTs === undefined) startTs = now
      const progress = Math.min((now - startTs) / durationMs, 1)
      const lockedCount = Math.floor(progress * digitIndices.length)
      for (let k = 0; k < digitIndices.length; k++) {
        const idx = digitIndices[k]
        chars[idx] = k < lockedCount ? final[idx] : randomDigit()
      }
      setDisplay(chars.join(''))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(final)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs])

  return (
    <span className={cn('tabular-nums', className)} style={style}>
      {display}
    </span>
  )
}

export default ScrambleNumber
