import { ReactNode } from 'react'
import styled, { css, keyframes } from 'styled-components'

import { useGuidedHighlight } from 'pages/Earns/components/SmartExit/GuidedHighlight'

const highlight = keyframes`
  0% {
    box-shadow: 0 0 0 0 var(--highlight-color);
  }
  70% {
    box-shadow: 0 0 0 2px var(--highlight-color);
  }
  100% {
    box-shadow: 0 0 0 0 var(--highlight-color);
  }
`

const highlightStyles = css`
  --highlight-color: ${({ theme }) => theme.primary};
  border-radius: 12px;
  animation: ${highlight} 2s 2 alternate ease-in-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

// Using key={animationKey} to force re-render and re-trigger animation
const HighlightContainer = styled.div<{ $isHighlighted: boolean }>`
  flex: 1;
  ${({ $isHighlighted }) => $isHighlighted && highlightStyles}
`

interface HighlightWrapperProps {
  children: ReactNode
  isHighlighted: boolean
  className?: string
}

export const HighlightWrapper = ({ children, isHighlighted, className }: HighlightWrapperProps) => {
  const { animationKey } = useGuidedHighlight()

  return (
    <HighlightContainer $isHighlighted={isHighlighted} className={className} key={animationKey}>
      {children}
    </HighlightContainer>
  )
}

// For inline elements like inputs
const InlineHighlightContainer = styled.span<{ $isHighlighted: boolean }>`
  display: inline-flex;
  flex: 1;
  ${({ $isHighlighted }) => $isHighlighted && highlightStyles}
`

export const InlineHighlightWrapper = ({ children, isHighlighted, className }: HighlightWrapperProps) => {
  const { animationKey } = useGuidedHighlight()

  return (
    <InlineHighlightContainer $isHighlighted={isHighlighted} className={className} key={animationKey}>
      {children}
    </InlineHighlightContainer>
  )
}
