import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

type DotsProps = HTMLAttributes<HTMLSpanElement> & {
  /** Keep ellipsis out of the text flow so loading dots do not shift centered labels. */
  absolute?: boolean
  /** Set false to reuse the wrapper without appending animated dots. */
  loading?: boolean
}

const Dots = forwardRef<HTMLSpanElement, DotsProps>(({ absolute, className, loading = true, ...rest }, ref) => (
  <span
    ref={ref}
    className={cn(loading && 'animate-ellipsis', loading && absolute && 'animate-ellipsis-absolute', className)}
    {...rest}
  />
))
Dots.displayName = 'Dots'

export default Dots
