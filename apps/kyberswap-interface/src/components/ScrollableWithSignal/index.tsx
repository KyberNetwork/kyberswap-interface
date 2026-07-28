import { type HTMLAttributes, PropsWithChildren, forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { cn } from 'utils/cn'

type Props = HTMLAttributes<HTMLDivElement> &
  PropsWithChildren<{
    isOpen?: boolean
    showArrow?: boolean
    showBackground?: boolean
    'data-open'?: 'true' | 'false'
    'data-signal'?: 'true' | 'false'
  }>

const ScrollableWithSignal = forwardRef<HTMLDivElement, Props>(function ScrollableWithSignal(
  { children, showArrow = false, showBackground = false, className, ...rest }: Props,
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
    updateSignal(localRef.current)
  }, [children, updateSignal])

  const isOpen = rest['data-open'] === 'true'
  const disabledSignal = rest['data-signal'] === 'false'

  return (
    <div
      ref={setRefs}
      {...rest}
      data-signal-visible={isOpen && !disabledSignal && hasMore ? 'true' : 'false'}
      data-show-arrow={isOpen && showArrow ? 'true' : 'false'}
      data-show-background={isOpen && showBackground ? 'true' : 'false'}
      onScroll={e => updateSignal(e.currentTarget)}
      className={cn('ks-scrollable-with-signal overflow-auto', className)}
    >
      {children}
    </div>
  )
})

export default ScrollableWithSignal
