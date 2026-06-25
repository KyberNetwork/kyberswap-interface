import { ReactNode } from 'react'

import { useGuidedHighlight } from 'pages/Earns/components/SmartExit/GuidedHighlight'
import { cn } from 'utils/cn'

const HIGHLIGHT_CLASS = 'animate-highlight rounded-xl motion-reduce:animate-none'

interface HighlightWrapperProps {
  children: ReactNode
  isHighlighted: boolean
  className?: string
}

export const HighlightWrapper = ({ children, isHighlighted, className }: HighlightWrapperProps) => {
  const { animationKey } = useGuidedHighlight()
  return (
    <div key={animationKey} className={cn('flex-1', isHighlighted && HIGHLIGHT_CLASS, className)}>
      {children}
    </div>
  )
}

export const InlineHighlightWrapper = ({ children, isHighlighted, className }: HighlightWrapperProps) => {
  const { animationKey } = useGuidedHighlight()
  return (
    <span key={animationKey} className={cn('inline-flex flex-1', isHighlighted && HIGHLIGHT_CLASS, className)}>
      {children}
    </span>
  )
}
