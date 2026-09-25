import { type HTMLAttributes, PropsWithChildren, forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { cn } from 'utils/cn'

type Props = HTMLAttributes<HTMLDivElement> &
  PropsWithChildren<{
    isOpen?: boolean
    showArrow?: boolean
    wrapperClassName?: string
    'data-open'?: 'true' | 'false'
    'data-signal'?: 'true' | 'false'
  }>

const ScrollableWithSignal = forwardRef<HTMLDivElement, Props>(function ScrollableWithSignal(
  {
    children,
    showArrow = false,
    className,
    wrapperClassName,
    'data-open': dataOpen,
    'data-signal': dataSignal,
    ...rest
  }: Props,
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  const updateSignal = useCallback((target?: HTMLElement | null) => {
    if (!target) return
    const hasRemaining = target.scrollHeight - target.clientHeight - target.scrollTop > 10
    setHasMore(prev => (prev === hasRemaining ? prev : hasRemaining))
  }, [])

  useEffect(() => {
    const target = localRef.current
    updateSignal(target)

    if (!target || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => updateSignal(target))
    observer.observe(target)

    return () => observer.disconnect()
  }, [children, updateSignal])

  const isOpen = dataOpen === 'true'
  const disabledSignal = dataSignal === 'false'

  return (
    <div
      className={cn('ks-scrollable-with-signal relative min-h-0', wrapperClassName)}
      data-signal-visible={isOpen && !disabledSignal && hasMore ? 'true' : 'false'}
    >
      <div
        ref={setRefs}
        {...rest}
        data-open={dataOpen}
        data-signal={dataSignal}
        onScroll={e => updateSignal(e.currentTarget)}
        className={cn('overflow-auto', className)}
      >
        {children}
      </div>
      {showArrow && (
        <span aria-hidden className="ks-scrollable-with-signal-arrow">
          <ChevronDown size={14} strokeWidth={2.25} />
        </span>
      )}
    </div>
  )
})

export default ScrollableWithSignal
