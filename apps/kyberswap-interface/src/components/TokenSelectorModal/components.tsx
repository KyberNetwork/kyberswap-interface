import { ComponentProps, ComponentPropsWithoutRef, forwardRef } from 'react'
import { Search } from 'react-feather'

import Column, { AutoColumn } from 'components/Column'
import { cn } from 'utils/cn'

export const ContentWrapper = ({ className, ...rest }: ComponentProps<typeof Column>) => (
  <Column className={cn('relative w-full flex-1', className)} {...rest} />
)

export const PaddedColumn = forwardRef<HTMLDivElement, ComponentProps<typeof AutoColumn>>(
  ({ className, ...props }, ref) => <AutoColumn ref={ref} className={cn('gap-3 p-5 pb-3', className)} {...props} />,
)
PaddedColumn.displayName = 'PaddedColumn'

export const SearchWrapper = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('relative h-[44px]', className)} {...props} />
)

export const SearchIcon = ({ className, ...props }: ComponentProps<typeof Search>) => (
  <Search className={cn('absolute right-3 top-3.5', className)} {...props} />
)

export const SearchInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'absolute size-full whitespace-nowrap rounded-full border border-buttonBlack bg-buttonBlack px-4 py-3 pr-[30px] text-[17px] leading-normal text-text outline-none transition-[border] duration-100 [-webkit-appearance:none]',
        'placeholder:text-[12.5px] placeholder:text-border sm:placeholder:text-[13.5px]',
        'focus:border-primary-50 focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
)
SearchInput.displayName = 'SearchInput'

export const Separator = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('h-px w-full shrink-0 bg-border', className)} {...props} />
)
