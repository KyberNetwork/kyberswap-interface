import { formatBalance } from '@kyber/utils/balance'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ComponentProps, ComponentPropsWithoutRef, forwardRef } from 'react'
import { Search } from 'react-feather'

import Column, { AutoColumn } from 'components/Column'
import { BALANCE_MAX_LENGTH } from 'components/TokenSelectorModal/constants'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { shortenAddress } from 'utils/address'
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

// Compact age badge for the New tab, counted from when the token was whitelisted: "NEW" under 12h,
// then hours ("15H") up to a day, then days ("3D").
export const formatAgeBadge = (addedAt?: number): string | null => {
  if (!addedAt) return null
  const hours = Math.floor(Date.now() / 1000 / 3600 - addedAt / 3600)
  if (hours < 12) return 'NEW'
  if (hours < 24) return `${hours}H`
  return `${Math.floor(hours / 24)}D`
}

// Shortened token address shown next to the name on the All tab; click the text to copy.
export const AddressCopy = ({ chainId, address }: { chainId: ChainId; address: string }) => {
  const [copied, setCopied] = useCopyClipboard(1500)
  const short = shortenAddress(chainId, address, 4, false)
  return (
    <span
      role="button"
      data-testid="copy-token-address"
      onClick={e => {
        e.stopPropagation()
        setCopied(address)
      }}
      className="relative shrink-0 cursor-pointer text-gray transition-colors hover:text-text"
    >
      {short}
      {copied === address && (
        <span className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-tableHeader px-1.5 py-0.5 text-[10px] font-medium text-text shadow-[0px_2px_8px_rgba(0,0,0,0.4)]">
          <Trans>Copied!</Trans>
        </span>
      )}
    </span>
  )
}
