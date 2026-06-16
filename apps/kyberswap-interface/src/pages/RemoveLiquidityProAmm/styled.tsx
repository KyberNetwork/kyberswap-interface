import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { cn } from 'utils/cn'

export const Container = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mx-auto mb-3 w-[calc(100%-24px)] max-w-screen-lg rounded-lg text-center', className)} {...rest}>
    {children}
  </div>
)

export const GridColumn = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-[1.35fr_2fr] gap-6 max-md:grid-cols-[1fr]', className)} {...rest}>
    {children}
  </div>
)

export const FirstColumn = ({ children, className, ...rest }: React.ComponentProps<typeof AutoColumn>) => (
  <AutoColumn
    className={cn(
      'h-fit gap-4 border-r border-solid border-border pr-6 [grid-auto-rows:min-content] max-md:gap-5 max-md:border-0 max-md:pr-0',
      className,
    )}
    {...rest}
  >
    {children}
  </AutoColumn>
)

export const SecondColumn = ({ children, className, ...rest }: React.ComponentProps<typeof AutoColumn>) => (
  <AutoColumn className={cn('rounded-[1.25rem] [grid-auto-rows:min-content]', className)} {...rest}>
    {children}
  </AutoColumn>
)

export const Content = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('rounded-[20px] border border-solid border-border bg-background p-6 max-sm:p-4', className)}
    {...rest}
  >
    {children}
  </div>
)

export const AmoutToRemoveContent = ({ children, className, ...rest }: React.ComponentProps<typeof BlackCard>) => (
  <BlackCard className={cn('p-4 max-sm:bg-transparent max-sm:p-0', className)} {...rest}>
    {children}
  </BlackCard>
)

export const TokenId = ({
  children,
  className,
  color,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { color: string }) => (
  <div className={cn('text-base font-medium', className)} style={{ color }} {...rest}>
    {children}
  </div>
)

export const TokenInputWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-4 flex w-full gap-4 max-sm:flex-col', className)} {...rest}>
    {children}
  </div>
)
