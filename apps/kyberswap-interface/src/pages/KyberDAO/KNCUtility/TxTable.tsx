import { cn } from 'utils/cn'

const ROW_BASE_CLASS =
  'grid h-[46px] w-full grid-cols-[2fr_1fr_1fr_1.5fr] items-center gap-x-4 border-t border-solid border-border bg-transparent px-5 max-md:grid-cols-[2fr_1fr_1fr_1fr] max-md:gap-x-2 max-[500px]:grid-cols-[1fr_1fr] [&[role=button]]:cursor-pointer'

export const Table = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col', className)} {...rest}>
    {children}
  </div>
)

export const Row = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(ROW_BASE_CLASS, className)} {...rest}>
    {children}
  </div>
)

export const TableHeader = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <Row className={cn('rounded-t-lg border-t-0 bg-background text-subText', className)} {...rest}>
    {children}
  </Row>
)

export const TableRow = Row

export const Cell = ({
  children,
  className,
  textAlign,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { textAlign?: 'left' | 'center' | 'right' }) => (
  <span
    className={cn(
      'text-xs font-medium leading-4',
      textAlign === 'center' && 'text-center',
      textAlign === 'right' && 'text-right',
      className,
    )}
    {...rest}
  >
    {children}
  </span>
)

export const HeaderCell = Cell
