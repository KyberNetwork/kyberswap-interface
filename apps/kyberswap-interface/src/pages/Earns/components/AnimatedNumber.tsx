import { useEffect, useRef, useState } from 'react'

import { cn } from 'utils/cn'

export default function AnimatedNumber({
  value,
  className,
  style,
}: {
  value: string
  className?: string
  style?: React.CSSProperties
}) {
  const prevValueRef = useRef(value)
  const [displayValue, setDisplayValue] = useState(value)
  const [prevValue, setPrevValue] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (value === prevValueRef.current) return

    setPrevValue(prevValueRef.current)
    setDisplayValue(value)
    prevValueRef.current = value

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setPrevValue(null)
    }, 400)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [value])

  const isAnimating = prevValue !== null

  return (
    <span
      className={cn('relative inline-flex max-w-full overflow-hidden text-ellipsis align-bottom', className)}
      style={style}
    >
      {isAnimating && (
        <span className="absolute left-0 top-0 inline-block [animation:ks-roll-out_0.4s_ease-out_forwards] motion-reduce:animate-none">
          {prevValue}
        </span>
      )}
      <span
        className={cn(
          'inline-block',
          isAnimating && '[animation:ks-roll-up_0.4s_ease-out_forwards] motion-reduce:animate-none',
        )}
      >
        {displayValue}
      </span>
    </span>
  )
}
