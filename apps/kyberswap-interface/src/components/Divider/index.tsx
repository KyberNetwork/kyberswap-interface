import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

const Divider = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('h-px w-full bg-border', className)} {...rest} />
))
Divider.displayName = 'Divider'
export default Divider
