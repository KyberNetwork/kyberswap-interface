import { useEffect, useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'

const rollUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`

const rollOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
`

const Wrapper = styled.span`
  display: inline-flex;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  max-width: 100%;
`

const Value = styled.span<{ $animate: 'in' | 'out' | 'none' }>`
  display: inline-block;
  ${({ $animate }) =>
    $animate === 'in' &&
    css`
      animation: ${rollUp} 0.4s ease-out forwards;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
  ${({ $animate }) =>
    $animate === 'out' &&
    css`
      position: absolute;
      top: 0;
      left: 0;
      animation: ${rollOut} 0.4s ease-out forwards;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`

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
    <Wrapper className={className} style={style}>
      {isAnimating && <Value $animate="out">{prevValue}</Value>}
      <Value $animate={isAnimating ? 'in' : 'none'}>{displayValue}</Value>
    </Wrapper>
  )
}
