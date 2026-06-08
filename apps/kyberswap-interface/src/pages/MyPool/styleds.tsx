import { cn } from 'utils/cn'

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative', className)} {...rest}>
    {children}
  </div>
)

export const Dots = ({ children = '', className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('animate-ellipsis', className)} {...rest}>
    {children}
  </span>
)
