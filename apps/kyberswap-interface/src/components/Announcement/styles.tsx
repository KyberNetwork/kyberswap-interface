import { cn } from 'utils/cn'

export const StyledMenuButton = ({
  children,
  className,
  active,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
  <button
    className={cn(
      'relative m-0 flex size-10 items-center justify-center rounded-full border border-solid border-transparent bg-transparent p-0 outline-none hover:cursor-pointer',
      active ? 'text-text' : 'text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)

export const StyledMenu = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative flex items-center justify-center border-0 text-left', className)} {...rest}>
    {children}
  </div>
)

export const Badge = ({
  children,
  className,
  isOverflow,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { isOverflow: boolean }) => (
  <div
    className={cn(
      'absolute -top-1.5 z-[1] min-w-[20px] rounded-2xl bg-primary px-1 pb-px pt-0.5 text-center font-medium',
      isOverflow ? '-right-4' : '-right-2.5',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const ANNOUNCEMENT_FLYOUT_CLASS = '!p-0 !rounded-xl max-lg:!top-auto max-lg:!bottom-14'

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex h-[600px] max-h-[80vh] w-[380px] flex-col max-md:w-full max-md:min-w-[380px] max-sm:h-auto max-sm:w-full max-sm:min-w-0',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const Container = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-3 px-4 py-3', className)} {...rest}>
    {children}
  </div>
)

export const Title = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-1.5 text-xl font-medium', className)} {...rest}>
    {children}
  </div>
)

export const ListAnnouncement = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-b-xl max-sm:rounded-none',
      '[&_.scrollbar::-webkit-scrollbar-thumb]:bg-border [&_.scrollbar::-webkit-scrollbar]:block [&_.scrollbar::-webkit-scrollbar]:w-1',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const ContentHeader = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-[48px] items-center justify-between gap-2 border-b border-solid border-border bg-background px-4 py-2 hover:bg-buttonBlack',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const BackButton = ({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn('inline-flex cursor-pointer border-0 bg-transparent text-subText hover:text-text', className)}
    {...rest}
  >
    {children}
  </button>
)

export const HeaderTitle = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 text-left text-sm font-medium uppercase text-text', className)} {...rest}>
    {children}
  </div>
)

export const HeaderAction = ({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'inline-flex cursor-pointer gap-1 border-0 bg-transparent text-primary disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)
