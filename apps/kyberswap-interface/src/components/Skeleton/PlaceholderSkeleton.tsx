import { useState } from 'react'

import Skeleton, { SkeletonProps } from 'components/Skeleton'
import { cn } from 'utils/cn'

type PlaceholderSkeletonProps = Pick<SkeletonProps, 'height' | 'borderRadius' | 'variant'> & {
  children: string | number
  isLoading?: boolean
  className?: string
  contentTestId?: string
  loadingTestId?: string
}

/**
 * Covers a single text value while preserving its last settled width and line height.
 * Uses `variant="muted"` for a gentle shimmer beside existing content; accepts every Skeleton variant.
 */
const PlaceholderSkeleton = ({
  children,
  isLoading = false,
  className,
  height = '1em',
  borderRadius = 6,
  variant = 'muted',
  contentTestId,
  loadingTestId,
}: PlaceholderSkeletonProps) => {
  // Initial children provide the footprint before the first result is available.
  const [settledContent, setSettledContent] = useState(children)
  if (!isLoading && settledContent !== children) setSettledContent(children)

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center whitespace-nowrap', className)}
      aria-busy={isLoading}
    >
      <span
        className={cn(isLoading && 'invisible')}
        aria-hidden={isLoading}
        data-testid={isLoading ? undefined : contentTestId}
      >
        {isLoading ? settledContent : children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center" data-testid={loadingTestId} aria-hidden="true">
          <Skeleton
            height={height}
            width="100%"
            borderRadius={borderRadius}
            variant={variant}
            containerClassName="w-full"
          />
        </span>
      )}
    </span>
  )
}

export default PlaceholderSkeleton
