import { BodyWrapper } from 'pages/AppBody'
import { cn } from 'utils/cn'

export const AppBodyWrapped = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <BodyWrapper
    className={cn('mt-0 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] data-[highlight=true]:animate-highlight', className)}
    {...rest}
  >
    {children}
  </BodyWrapper>
)

export const SwitchLocaleLinkWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('pb-8 max-md:pb-0', className)} {...rest}>
    {children}
  </div>
)

export const BannerWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid w-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 overflow-hidden max-lg:hidden max-lg:grid-cols-[minmax(0,1fr)] max-lg:gap-3',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)
