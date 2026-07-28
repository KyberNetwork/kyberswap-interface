import { AutoColumn } from 'components/Column'
import { cn } from 'utils/cn'

export const PageWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'w-full px-4 pb-[100px] pt-7',
      'sm:px-4 sm:pt-6 [@media(min-width:1000px)]:px-8 [@media(min-width:1366px)]:px-[215px] [@media(min-width:1366px)]:pb-[50px] [@media(min-width:1440px)]:px-[252px]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const Container = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'mx-auto max-w-[936px] rounded-[20px] bg-background px-5 pb-6 pt-1 [@media(min-width:1000px)]:px-6',
      'shadow-[0_0_1px_rgba(0,0,0,0.01),0_4px_8px_rgba(0,0,0,0.04),0_16px_24px_rgba(0,0,0,0.04),0_24px_32px_rgba(0,0,0,0.01)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const GridColumn = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-[1fr] sm:grid-cols-[1fr_1fr]', className)} {...rest}>
    {children}
  </div>
)

export const TopBar = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'mt-4 flex flex-col-reverse items-center border-t border-solid border-border py-5',
      'sm:mt-0 sm:grid sm:grid-cols-[1fr_1fr]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const LiquidityProviderModeWrapper = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('w-full sm:pr-6', className)} {...rest}>
    {children}
  </div>
)

export const PoolName = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-6 flex text-sm font-medium text-subText sm:mb-0 sm:justify-end', className)} {...rest}>
    {children}
  </div>
)

export const FirstColumn = ({ children, className, ...rest }: React.ComponentProps<typeof AutoColumn>) => (
  <AutoColumn
    className={cn(
      'gap-5 border-b border-solid border-border pb-6 [grid-auto-rows:min-content]',
      'sm:border-0 sm:border-r sm:border-solid sm:border-border sm:pb-0 sm:pr-6',
      className,
    )}
    {...rest}
  >
    {children}
  </AutoColumn>
)

export const SecondColumn = ({ children, className, ...rest }: React.ComponentProps<typeof AutoColumn>) => (
  <AutoColumn className={cn('pt-6 [grid-auto-rows:min-content] sm:pl-6 sm:pt-0', className)} {...rest}>
    {children}
  </AutoColumn>
)

export const MaxButton = ({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'm-1 flex-1 cursor-pointer overflow-hidden rounded-full border border-solid border-transparent bg-primary-20 py-1.5 text-base font-medium text-primary hover:border-primary focus:border-primary focus:outline-none max-sm:py-1',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)

export const DetailWrapper = ({ children, className, ...rest }: React.ComponentProps<typeof AutoColumn>) => (
  <AutoColumn
    className={cn('my-6 mb-7 rounded-[20px] border border-solid border-border px-4 pb-3 pt-4', className)}
    {...rest}
  >
    {children}
  </AutoColumn>
)

export const DetailBox = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-[1fr_1fr]', className)} {...rest}>
    {children}
  </div>
)

export const TokenWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-1', className)} {...rest}>
    {children}
  </div>
)

export const ModalDetailWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-7 rounded-[20px] border border-solid border-border p-4', className)} {...rest}>
    {children}
  </div>
)

export const CurrentPriceWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between', className)} {...rest}>
    {children}
  </div>
)
