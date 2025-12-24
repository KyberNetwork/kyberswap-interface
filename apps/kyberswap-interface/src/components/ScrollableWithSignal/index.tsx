import { type HTMLAttributes, PropsWithChildren, forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'

type Props = HTMLAttributes<HTMLDivElement> &
  PropsWithChildren<{
    isOpen?: boolean
    showArrow?: boolean
    showBackground?: boolean
    'data-open'?: 'true' | 'false'
    'data-signal'?: 'true' | 'false'
  }>

const arrowBounce = keyframes`
  0% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -4px); }
  100% { transform: translate(-50%, 0); }
`

const BaseScrollable = styled.div`
  overflow: auto;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5));
  }

  &[data-signal-visible='true'][data-show-background='true']::after {
    opacity: 1;
  }

  &::before {
    content: '↓';
    position: absolute;
    bottom: 6px;
    left: 50%;
    width: 18px;
    height: 18px;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.black};
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    transform: translate(-50%, 0);
    animation: ${arrowBounce} 1.2s ease-in-out infinite;
  }

  &[data-signal-visible='true'][data-show-arrow='true']::before {
    display: flex;
    opacity: 1;
  }
`

const ScrollableWithSignal = forwardRef<HTMLDivElement, Props>(function ScrollableWithSignal(
  { children, showArrow = false, showBackground = false, ...rest }: Props,
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
    <BaseScrollable
      ref={setRefs}
      {...rest}
      data-signal-visible={isOpen && !disabledSignal && hasMore ? 'true' : 'false'}
      data-show-arrow={isOpen && showArrow ? 'true' : 'false'}
      data-show-background={isOpen && showBackground ? 'true' : 'false'}
      onScroll={e => updateSignal(e.currentTarget)}
    >
      {children}
    </BaseScrollable>
  )
})

export default ScrollableWithSignal
