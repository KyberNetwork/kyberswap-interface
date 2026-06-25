import { cn } from 'utils/cn'

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative', className)} {...rest}>
    {children}
  </div>
)
