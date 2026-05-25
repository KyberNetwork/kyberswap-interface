import { forwardRef } from 'react'

import Input from 'components/Input'
import Select from 'components/Select'
import { cn } from 'utils/cn'

export const ContentWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-5 flex flex-row gap-5 max-sm:flex-col', className)} {...rest}>
    {children}
  </div>
)

export const CustomBox = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col gap-3 rounded-2xl border border-solid border-tableHeader p-3', className)}
    {...rest}
  >
    {children}
  </div>
)

export const CustomInput = ({ className, ...rest }: React.ComponentProps<typeof Input>) => (
  <Input className={cn('flex-1 rounded-xl border-0 bg-text-04 px-4 py-2 text-base text-text', className)} {...rest} />
)

export const PriceCustomInput = ({ className, ...rest }: React.ComponentProps<typeof Input>) => (
  <CustomInput className={cn('px-3 py-2', className)} {...rest} />
)

export const CustomSelect = ({ className, ...rest }: React.ComponentProps<typeof Select>) => (
  <Select className={cn('w-full flex-1 bg-text-04 px-4 py-2.5 text-sm text-text', className)} {...rest} />
)

export const Divider = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-px bg-tableHeader', className)} {...rest} />
)

export const CustomOption = ({
  children,
  className,
  isSelected,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { isSelected?: boolean }) => (
  <div
    className={cn(
      'cursor-pointer rounded-3xl border border-solid px-3 py-1 text-xs font-medium hover:bg-primary-10',
      isSelected ? 'border-primary-20 bg-primary-20 text-white2' : 'border-text-08 bg-transparent text-gray',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const PriceInputIcon = ({
  children,
  className,
  $active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { $active: boolean }) => (
  <div
    className={cn(
      'flex cursor-pointer items-center justify-center rounded-[10px] border border-solid px-2 pb-1 pt-0.5 text-xl',
      $active
        ? 'border-primary-20 bg-primary-20 text-text hover:bg-primary-20'
        : 'border-transparent bg-transparent text-subText hover:bg-text-08',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const SettingContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...rest }, ref) => (
    <div ref={ref} className={cn('relative', className)} {...rest}>
      {children}
    </div>
  ),
)
SettingContainer.displayName = 'SettingContainer'

export const SettingMenu = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'absolute right-0 top-11 z-[5] flex min-w-[350px] flex-col gap-3 rounded-2xl bg-tableHeader px-4 py-3',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const SettingButton = ({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'flex size-9 rotate-[270deg] cursor-pointer items-center justify-center rounded-3xl border border-solid border-text-04 bg-text-08 text-text-60 transition-[background-color,border-color,color] ease-linear [transition-duration:120ms] hover:bg-text-12',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)

export const PositionHeader = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex gap-2 max-sm:gap-3', className)} {...rest}>
    {children}
  </div>
)

export const DexInfo = ({
  children,
  className,
  openable,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { openable: boolean }) => (
  <div
    className={cn('flex items-center gap-1.5 text-text', openable && 'cursor-pointer hover:brightness-125', className)}
    {...rest}
  >
    {children}
  </div>
)
