import { formatBalance } from '@kyber/utils/balance'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { ComponentProps, ComponentPropsWithoutRef, forwardRef } from 'react'
import { Search } from 'react-feather'

import Column, { AutoColumn } from 'components/Column'
import { BALANCE_MAX_LENGTH } from 'components/TokenSelectorModal/constants'
import { cn } from 'utils/cn'

export const Balance = ({ balance }: { balance: CurrencyAmount<Currency> }) => {
  const exact = balance.toExact()

  return (
    <span className="max-w-full truncate text-xs tabular-nums text-text sm:text-sm" title={exact}>
      {/* The visible form carries subscripts and unit suffixes, which read as noise, so it is hidden
          from assistive tech and the plain number is announced in its place. */}
      <span data-testid="token-balance" aria-hidden="true">
        {formatBalance(exact, { maxLength: BALANCE_MAX_LENGTH })}
      </span>
      <span className="sr-only">{exact}</span>
    </span>
  )
}

export const ContentWrapper = ({ className, ...rest }: ComponentProps<typeof Column>) => (
  <Column className={cn('relative w-full flex-1', className)} {...rest} />
)

export const PaddedColumn = forwardRef<HTMLDivElement, ComponentProps<typeof AutoColumn>>(
  ({ className, ...props }, ref) => <AutoColumn ref={ref} className={cn('gap-3 p-5 pb-3', className)} {...props} />,
)
PaddedColumn.displayName = 'PaddedColumn'

export const SearchWrapper = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('relative h-10', className)} {...props} />
)

export const SearchIcon = ({ className, ...props }: ComponentProps<typeof Search>) => (
  <Search className={cn('absolute right-3 top-1/2 -translate-y-1/2', className)} {...props} />
)

export const SearchInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'absolute size-full whitespace-nowrap rounded-xl bg-black/20 px-3 pr-9 text-sm leading-normal text-text outline-none [-webkit-appearance:none]',
        'placeholder:text-sm placeholder:text-gray',
        'focus:outline-none',
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
