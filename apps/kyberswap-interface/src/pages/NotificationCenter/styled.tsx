import { cn } from 'utils/cn'

export const ShareContentWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex size-full flex-col max-md:flex-1 max-md:px-4 max-md:py-0', className)} {...rest}>
    {children}
  </div>
)

export const ShareWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex size-full flex-col p-6 max-md:flex-1 max-md:p-0', className)} {...rest}>
    {children}
  </div>
)
