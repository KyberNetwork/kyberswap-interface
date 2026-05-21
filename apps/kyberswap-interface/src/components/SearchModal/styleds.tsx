import { ComponentProps, ComponentPropsWithoutRef, forwardRef } from 'react'
import { Search } from 'react-feather'

import { AutoColumn } from 'components/Column'
import { cn } from 'utils/cn'

export const PaddedColumn = forwardRef<HTMLDivElement, ComponentProps<typeof AutoColumn>>(
  ({ className, ...props }, ref) => <AutoColumn ref={ref} className={cn('p-5 pb-3', className)} {...props} />,
)
PaddedColumn.displayName = 'PaddedColumn'

export const SearchWrapper = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('relative h-[45px]', className)} {...props} />
)

export const SearchIcon = ({ className, ...props }: ComponentProps<typeof Search>) => (
  <Search className={cn('absolute right-3 top-3', className)} {...props} />
)

export const SearchInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'absolute flex w-full items-center whitespace-nowrap rounded-full border border-buttonBlack bg-buttonBlack px-4 pb-[13px] pr-[30px] pt-2.5 text-[17px] text-text outline-none transition-[border] duration-100 [-webkit-appearance:none]',
        'placeholder:text-[12.5px] placeholder:text-border sm:placeholder:text-[13.5px]',
        'focus:border-primary focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
)
SearchInput.displayName = 'SearchInput'

export const Separator = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('h-px w-full bg-border', className)} {...props} />
)
