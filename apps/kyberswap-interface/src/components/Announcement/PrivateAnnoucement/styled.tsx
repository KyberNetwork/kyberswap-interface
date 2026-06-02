import { cn } from 'utils/cn'

export const ItemActionWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-ann-actions
    className={cn(
      'pointer-events-none absolute right-1 top-1 z-[2] flex -translate-y-1 items-center gap-3 rounded-lg bg-tableHeader/90 p-1 opacity-0 transition-[opacity,transform] duration-150 ease-in-out',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const ItemActionButton = ({
  children,
  className,
  $active,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean }) => (
  <button
    className={cn(
      'size-4 cursor-pointer border-0 bg-transparent p-0 [&_svg]:size-4',
      $active ? 'text-primary hover:text-primary' : 'text-subText hover:text-text',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)

export const PinnedBadge = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-ann-pinned-badge
    className={cn(
      'absolute right-2 top-2 z-[1] flex items-center justify-center text-primary [&_svg]:size-4',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const InboxItemWrapper = ({
  children,
  className,
  isRead,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { isRead: boolean }) => (
  <div
    className={cn(
      'relative flex cursor-pointer flex-col gap-2 border-b border-solid border-border bg-background px-4 py-5 text-xs',
      isRead ? 'hover:bg-buttonBlack' : 'bg-primary-10 hover:bg-primary-12',
      'hover:[&_[data-ann-actions]]:pointer-events-auto hover:[&_[data-ann-actions]]:translate-y-0 hover:[&_[data-ann-actions]]:opacity-100 hover:[&_[data-ann-pinned-badge]]:opacity-0',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const Title = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { isRead?: boolean }) => (
  <div className={cn('text-sm font-medium text-primary', className)} {...rest}>
    {children}
  </div>
)

export const StatusTitle = ({
  children,
  className,
  isRead,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { isRead?: boolean }) => (
  <Title className={cn('flex items-center gap-1.5', isRead ? 'text-text' : 'text-primary', className)} {...rest}>
    {children}
  </Title>
)

export const PrimaryText = ({
  children,
  className,
  color,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { color?: string }) => (
  <div className={cn('text-xs text-text', className)} style={color ? { color } : undefined} {...rest}>
    {children}
  </div>
)

export const InboxItemTime = ({
  children,
  className,
  color,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) => (
  <span className={cn('text-subText', className)} style={color ? { color } : undefined} {...rest}>
    {children}
  </span>
)

export const Dot = ({ className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('size-2 rounded-full bg-primary', className)} {...rest} />
)

export const InboxItemRow = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-end justify-between', className)} {...rest}>
    {children}
  </div>
)

export const RowItem = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-1.5', className)} {...rest}>
    {children}
  </div>
)

export const AmountRow = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-wrap items-center gap-2 text-[13px] font-semibold text-text', className)} {...rest}>
    {children}
  </div>
)

export const AmountItem = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-1.5', className)} {...rest}>
    {children}
  </div>
)

export const DetailList = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2', className)} {...rest}>
    {children}
  </div>
)

export const DetailItem = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-wrap items-center gap-1.5 text-xs text-subText', className)} {...rest}>
    {children}
  </div>
)

export const DetailValue = ({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('font-medium text-text/80', className)} {...rest}>
    {children}
  </span>
)

export const MetaRow = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between gap-2', className)} {...rest}>
    {children}
  </div>
)
