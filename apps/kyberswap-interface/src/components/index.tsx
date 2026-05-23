import { HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

export const TruncatedText = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} className={cn('truncate', className)} />
)
