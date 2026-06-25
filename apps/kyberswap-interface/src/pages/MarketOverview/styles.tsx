import { cn } from 'utils/cn'

export const TableWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('overflow-hidden rounded-2xl bg-background/80 max-md:-mx-4', className)} {...rest}>
    {children}
  </div>
)

export const ContentWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 max-md:p-4', className)} {...rest}>
    {children}
  </div>
)

export const Tag = ({
  children,
  className,
  active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { active: boolean }) => (
  <div
    className={cn(
      'cursor-pointer rounded-xl border border-solid px-4 py-2 text-sm',
      active
        ? 'border-primary bg-primary-20 font-medium text-text'
        : 'border-transparent bg-tableHeader font-normal text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const TableHeader = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-[1fr_2fr_1.2fr_100px] items-center', className)} {...rest}>
    {children}
  </div>
)

export const TableRow = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid cursor-pointer grid-cols-[1fr_0.5fr_0.5fr_0.5fr_0.5fr_0.6fr_0.6fr_100px] items-center border-b-0 hover:bg-buttonBlack max-md:grid-cols-[1fr_1fr_1fr]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const SubHeaderRow = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <TableRow className={cn('text-sm text-subText hover:bg-transparent', className)} {...rest}>
    {children}
  </TableRow>
)

export const Tabs = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-3 py-4 text-subText', className)} {...rest}>
    {children}
  </div>
)

export const Tab = ({
  children,
  className,
  active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { active: boolean }) => (
  <div
    className={cn('cursor-pointer text-sm font-medium', active ? 'text-primary' : 'text-subText', className)}
    {...rest}
  >
    {children}
  </div>
)

export const ContentChangable = ({
  children,
  className,
  animate,
  up,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { animate: boolean; up: boolean }) => (
  <div
    className={cn(
      'flex items-center justify-end',
      animate && (up ? '[animation:ks-pulse-green_0.6s]' : '[animation:ks-pulse-red_0.6s]'),
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const PriceSelectionField = ({
  children,
  className,
  active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { active: boolean }) => (
  <div
    className={cn('cursor-pointer px-3 py-1.5 text-center text-sm text-text', active && 'bg-primary-20', className)}
    {...rest}
  >
    {children}
  </div>
)

export const TabItem = ({
  children,
  className,
  active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { active?: boolean }) => (
  <div
    className={cn(
      'flex items-center rounded-full px-2 py-1',
      active ? 'bg-tabActive text-text' : 'bg-transparent text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)
