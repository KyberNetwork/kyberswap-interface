import { cn } from 'utils/cn'

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-full cursor-pointer flex-col items-start gap-3 border-b border-solid border-border bg-background py-5 text-xs last:border-0',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const Title = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-1.5 text-sm font-medium text-text', className)} {...rest}>
    {children}
  </div>
)

export const Desc = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex max-w-full flex-wrap gap-1.5 break-words text-sm leading-4 text-subText', className)}
    {...rest}
  >
    {children}
  </div>
)

export const Time = ({
  children,
  className,
  isLeft,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { isLeft?: boolean }) => (
  <div
    className={cn('w-full text-subText max-md:text-[10px]', isLeft ? 'text-left' : 'text-right', className)}
    {...rest}
  >
    {children}
  </div>
)

export const ArrowWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex size-5 items-center justify-center text-subText [&_svg]:transition-all [&_svg]:duration-150 [&_svg]:ease-in-out data-[expanded=true]:[&_svg]:rotate-180',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)
