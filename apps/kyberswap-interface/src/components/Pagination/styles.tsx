import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

export const PaginationContainer = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  ({ className, ...rest }, ref) => (
    <ul
      ref={ref}
      className={cn('m-0 flex list-none justify-center gap-1 rounded-b-[20px] bg-subText-04 p-3', className)}
      {...rest}
    />
  ),
)
PaginationContainer.displayName = 'PaginationContainer'

type PaginationItemProps = HTMLAttributes<HTMLLIElement> & { $disabled?: boolean; $selected?: boolean }

export const PaginationItem = forwardRef<HTMLLIElement, PaginationItemProps>(
  ({ $disabled, $selected, className, ...rest }, ref) => (
    <li
      ref={ref}
      className={cn(
        'mx-0.5 my-auto flex min-w-9 items-center justify-center text-center text-xs',
        $selected ? 'pointer-events-none text-primary' : 'text-subText',
        $disabled && 'pointer-events-none opacity-50',
        className,
      )}
      {...rest}
    />
  ),
)
PaginationItem.displayName = 'PaginationItem'

type PaginationButtonProps = HTMLAttributes<HTMLDivElement> & { active?: boolean; haveBg?: boolean }

export const PaginationButton = forwardRef<HTMLDivElement, PaginationButtonProps>(
  ({ active, haveBg, className, ...rest }, ref) => {
    let bgClass: string
    if (!haveBg) {
      bgClass = active ? 'bg-black-48' : 'bg-black-20'
    } else {
      bgClass = active ? 'bg-buttonBlack' : 'bg-buttonBlack-40'
    }
    const hoverClass = haveBg ? 'hover:bg-buttonBlack' : 'hover:bg-black-40'
    const textClass = active ? 'text-primary' : 'text-white-60'
    return (
      <div
        ref={ref}
        className={cn(
          '!flex h-9 w-fit min-w-9 cursor-pointer items-center justify-center rounded-full p-0',
          textClass,
          bgClass,
          hoverClass,
          className,
        )}
        {...rest}
      />
    )
  },
)
PaginationButton.displayName = 'PaginationButton'
