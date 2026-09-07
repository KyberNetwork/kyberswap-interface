import { type HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

const VerticalDivider = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-0 w-px bg-border max-sm:h-auto', className)} {...props} />
)

export default VerticalDivider
