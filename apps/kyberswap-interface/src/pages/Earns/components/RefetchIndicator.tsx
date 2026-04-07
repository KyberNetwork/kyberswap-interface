import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'

const progressSlide = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
`

const Wrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s ease;
  z-index: 2;
`

const Bar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 25%;
  height: 100%;
  background: ${({ theme }) => theme.primary};
  border-radius: 2px;
  animation: ${progressSlide} 1.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const RefetchIndicator = ({ visible: propVisible }: { visible: boolean }) => {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const pendingHide = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (propVisible) {
      pendingHide.current = false
      setFading(false)
      setVisible(true)
    } else if (visible) {
      if (prefersReducedMotion()) {
        setFading(true)
        timer = setTimeout(() => setVisible(false), 300)
      } else {
        pendingHide.current = true
      }
    }
    return () => clearTimeout(timer)
  }, [propVisible, visible])

  const onAnimationIteration = useCallback(() => {
    if (pendingHide.current) {
      pendingHide.current = false
      setFading(true)
      setTimeout(() => setVisible(false), 300)
    }
  }, [])

  if (!visible) return null

  return (
    <Wrapper $visible={!fading}>
      <Bar onAnimationIteration={onAnimationIteration} />
    </Wrapper>
  )
}

export default RefetchIndicator
