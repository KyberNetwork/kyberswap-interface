import { HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

/**
 * Stands in for a figure, a chart or a control the page has not been able to draw yet. Sized by the
 * caller so a placeholder reserves exactly what the thing it replaces will take. Drawn from the
 * theme rather than the shared `PositionSkeleton`, whose fixed colours vanish against some of the
 * surfaces these sit on.
 */
const ValueSkeleton = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'inline-block h-4 w-[120px] animate-pulse rounded-lg bg-white-08 motion-reduce:animate-none',
      className,
    )}
    {...rest}
  />
)

export default ValueSkeleton
