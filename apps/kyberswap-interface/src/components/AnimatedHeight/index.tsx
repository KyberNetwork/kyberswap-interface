import { ReactNode, useEffect, useRef, useState } from 'react'
import { useMeasure } from 'react-use'

import { cn } from 'utils/cn'

/** How long the box takes to reach the content's new height. */
const DURATION_MS = 200

/**
 * A box that eases to the height of whatever it holds, so content swapped in place grows or shrinks the
 * box rather than snapping it. The content is clipped only while the box moves: an element reaching out
 * of it, such as an open dropdown, must not be cut off while it stands still.
 */
const AnimatedHeight = ({ children, className }: { children: ReactNode; className?: string }) => {
  const [contentRef, { height }] = useMeasure<HTMLDivElement>()
  const [isMoving, setIsMoving] = useState(false)
  const lastHeight = useRef(0)

  useEffect(() => {
    // The first measurement sets the box's starting height; only a change from there is a move.
    const isChange = lastHeight.current !== 0 && height !== 0 && height !== lastHeight.current
    lastHeight.current = height
    if (!isChange) return
    setIsMoving(true)
    const timer = window.setTimeout(() => setIsMoving(false), DURATION_MS + 20)
    return () => window.clearTimeout(timer)
  }, [height])

  return (
    <div
      className={cn(
        'transition-[height] duration-200 ease-out motion-reduce:transition-none',
        isMoving && 'overflow-hidden',
        className,
      )}
      // Auto until the content has been measured, so the first paint is already the right size.
      style={{ height: height || undefined }}
      data-testid="animated-height"
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

export default AnimatedHeight
