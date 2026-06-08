import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

const Dots = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(({ className, ...rest }, ref) => (
  <span ref={ref} className={cn('animate-ellipsis', className)} {...rest} />
))
Dots.displayName = 'Dots'
export default Dots
