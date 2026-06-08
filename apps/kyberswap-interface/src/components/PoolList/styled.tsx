import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

export const TabContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex w-full cursor-pointer rounded-[20px] bg-tabBackground p-0.5', className)}
      {...rest}
    />
  ),
)
TabContainer.displayName = 'TabContainer'

type TabItemProps = HTMLAttributes<HTMLDivElement> & { active?: boolean }

export const TabItem = forwardRef<HTMLDivElement, TabItemProps>(({ active, className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex grow basis-0 items-center justify-center rounded-[20px] p-1.5 text-xs font-medium transition-colors duration-300',
      active ? 'bg-tabActive text-text' : 'text-subText',
      className,
    )}
    {...rest}
  />
))
TabItem.displayName = 'TabItem'
