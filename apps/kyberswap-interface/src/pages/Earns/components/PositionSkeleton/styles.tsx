import { cn } from 'utils/cn'

export const SkeletonWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative', className)} {...rest}>
    {children}
  </div>
)

export const SkeletonText = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-subText', className)}
    {...rest}
  >
    {children}
  </div>
)
