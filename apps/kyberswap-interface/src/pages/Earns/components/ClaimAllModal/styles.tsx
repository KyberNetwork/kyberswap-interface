import { Collapse } from 'components/Collapse'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import { cn } from 'utils/cn'

export const RewardTabGroup = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex w-full overflow-hidden rounded-[20px] border border-solid border-white-08', className)}
    {...rest}
  >
    {children}
  </div>
)

export const RewardTab = ({
  children,
  className,
  active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { active?: boolean }) => (
  <div
    className={cn(
      'flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[20px] border border-solid px-4 py-2 text-sm font-medium transition-all duration-200 hover:text-text',
      active ? 'border-primary bg-primary-20 text-text' : 'border-transparent bg-transparent text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const ChainRewardItem = ({
  children,
  className,
  isSelected,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { isSelected: boolean }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-xl border border-solid px-4 transition-all duration-200 ease-in-out',
      isSelected
        ? 'border-primary-40 bg-primary-10 hover:bg-primary-15'
        : 'border-white-04 bg-white-04 hover:bg-white-08',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const CustomRadio = ({
  className,
  isSelected,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { isSelected: boolean }) => (
  <input
    type="radio"
    className={cn(
      'relative -top-px h-[18px] w-[18px] cursor-pointer appearance-none rounded-full border-2 border-solid border-border bg-transparent outline-none transition-colors duration-200',
      "before:absolute before:left-[2px] before:top-[2px] before:block before:size-2.5 before:rounded-full before:transition-colors before:duration-200 before:content-['']",
      isSelected ? 'before:bg-primary' : 'before:bg-transparent',
      className,
    )}
    {...rest}
  />
)

export const ChainRewardTitle = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex cursor-pointer items-center justify-between py-3', className)} {...rest}>
    {children}
  </div>
)

export const ChainRewardTokens = ({
  open,
  children,
  className,
  ...rest
}: React.ComponentProps<typeof ScrollableWithSignal> & { open: boolean }) => (
  <Collapse open={open}>
    <ScrollableWithSignal
      data-open={open ? 'true' : 'false'}
      className={cn(
        'flex max-h-[170px] flex-col gap-3 overflow-auto border-t border-solid border-t-primary-20 py-3 pl-8',
        className,
      )}
      {...rest}
    >
      {children}
    </ScrollableWithSignal>
  </Collapse>
)

export const FilteredChainWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative flex flex-col overflow-hidden', className)} {...rest}>
    {children}
  </div>
)

export const FilteredChainTitle = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-fit cursor-pointer flex-wrap items-center gap-1 text-subText', className)} {...rest}>
    {children}
  </div>
)

export const FilteredChainTokens = ({
  open,
  children,
  className,
  ...rest
}: React.ComponentProps<typeof ScrollableWithSignal> & { open: boolean }) => (
  <Collapse open={open} contentGap={3}>
    <ScrollableWithSignal
      data-open={open ? 'true' : 'false'}
      className={cn('flex max-h-[136px] flex-col gap-2 overflow-auto', className)}
      {...rest}
    >
      {children}
    </ScrollableWithSignal>
  </Collapse>
)
