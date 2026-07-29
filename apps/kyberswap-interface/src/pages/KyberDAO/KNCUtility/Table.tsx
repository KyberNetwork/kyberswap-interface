import { cn } from 'utils/cn'

export const Table = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col', className)} {...rest}>
    {children}
  </div>
)

export const Row = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid h-9 w-full grid-cols-[48px_1fr_96px_24px] items-center gap-x-4 border-t border-solid border-border bg-transparent px-5 max-sm:gap-x-2 [&[role=button]]:cursor-pointer',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const TableHeader = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <Row
    className={cn('border-t-0 bg-[linear-gradient(0deg,var(--ks-primary-50)_0%,var(--ks-primary-20)_100%)]', className)}
    {...rest}
  >
    {children}
  </Row>
)

export const TableRow = Row

export const HeaderCell = ({
  children,
  className,
  textAlign,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { textAlign?: 'left' | 'center' | 'right' }) => (
  <span
    className={cn(
      'text-base font-medium text-text',
      textAlign === 'center' && 'text-center',
      textAlign === 'right' && 'text-right',
      className,
    )}
    {...rest}
  >
    {children}
  </span>
)
