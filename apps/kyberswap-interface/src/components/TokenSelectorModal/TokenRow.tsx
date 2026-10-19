import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { CSSProperties, ReactNode } from 'react'
import { AlertTriangle, Info, Star, X } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { getDisplayTokenInfo } from 'components/TokenSelectorModal/PinnedTokens'
import { AddressCopy, Balance, formatAgeBadge } from 'components/TokenSelectorModal/components'
import { BALANCE_COLUMN_CLASS } from 'components/TokenSelectorModal/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import { restrictedTokenMessage } from 'hooks/useRestrictedTokens'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatBigLiquidity } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'
import { isTokenNative } from 'utils/tokenInfo'

type TokenRowProps = {
  showFavoriteIcon?: boolean
  /**
   * Whether this row may be favorited. A row that cannot keeps the toggle's width, so a list holding
   * both kinds stays in one column.
   */
  canFavorite?: boolean
  currency: Currency
  currencyBalance?: CurrencyAmount<Currency>
  onSelect?: (currency: Currency) => void
  isSelected: boolean
  otherSelected?: boolean
  style?: CSSProperties
  onToggleFavorite?: (event: React.MouseEvent, currency: Currency) => void
  onRemoveImportedToken?: (token: Token) => void
  customName?: ReactNode
  customBalance?: ReactNode
  usdBalance?: number
  hoverColor?: string
  hideBalance?: boolean
  showLoading?: boolean
  /** A balance the wallet may hold that no source produced; it reads as unknown rather than as zero. */
  balanceUnknown?: boolean
  isFavorite?: boolean
  onShowTokenInfo?: (token: Token) => void
  priceUsd?: number
  priceChange24h?: number
  /** USD value shown in the metric column — 24h volume or FDV, per the list's active metric. */
  metricValue?: number
  addedAt?: number
  showAddress?: boolean
  /** Show a copy-address icon next to the token name (tabs that have no room for the address text). */
  showCopyAddress?: boolean
  usdValueClassName?: string
  /** Render the fixed-width price / 24h-change column. Kept tab-level (not data-driven) so rows stay aligned. */
  showPriceColumn?: boolean
  /**
   * What the right column renders: the wallet 'balance' (default), the 'metric' value — 24h volume or
   * FDV (Trending / New) — or an 'import' button for a not-yet-imported token (which also makes
   * the whole row trigger import).
   */
  rightColumn?: 'balance' | 'metric' | 'import'
  /**
   * Non-whitelisted token shown as a normal row (with its metric column) rather than an Import button,
   * dimmed to 50%; clicking it opens the import flow. Used on the Trending / All tabs.
   */
  importOnClick?: boolean
  /** Start the import flow for a not-yet-imported token (via the Import button or an `importOnClick` row). */
  onImportToken?: (token: Token) => void
  /** Width of the right-hand column, kept in sync with the list header so the two stay aligned. */
  rightColumnClassName?: string
  /** Restricted in the user's jurisdiction: clicking the row reveals the inline notice instead of selecting. */
  restricted?: boolean
  /** Whether the inline "not available" notice is currently expanded for this row. */
  warned?: boolean
  /** Reveal the inline restricted notice (called on a restricted row's click). */
  onRestrictedClick?: () => void
  /**
   * Held token whose symbol belongs to a whitelisted token at a different address — the shape an
   * airdropped impersonation takes. Flagged so a fake cannot pass for the token it names.
   */
  impersonator?: boolean
  /** The connected wallet holds this token; shown as a badge while searching. */
  held?: boolean
}

export const TokenRow = ({
  currency,
  currencyBalance,
  onSelect,
  isSelected,
  otherSelected,
  style = {},
  onToggleFavorite,
  onRemoveImportedToken,
  showFavoriteIcon = true,
  canFavorite = true,
  customName,
  customBalance,
  usdBalance,
  hoverColor,
  hideBalance,
  showLoading,
  balanceUnknown,
  isFavorite,
  onShowTokenInfo,
  priceUsd,
  priceChange24h,
  metricValue,
  addedAt,
  showAddress,
  showCopyAddress,
  usdValueClassName = 'text-subText',
  showPriceColumn,
  rightColumn = 'balance',
  rightColumnClassName = BALANCE_COLUMN_CLASS,
  importOnClick,
  onImportToken,
  restricted,
  warned,
  onRestrictedClick,
  impersonator,
  held,
}: TokenRowProps) => {
  const isImport = rightColumn === 'import'
  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)
  // Uniform skeleton width so balance rows stay aligned and don't jitter as they re-sort while balances load.
  const balanceSkeletonWidth = 56

  const onClickRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemoveImportedToken?.(currency as Token)
  }

  const renderBalance = () => {
    if (hideBalance) return <span className="max-w-full truncate text-xs text-text sm:text-sm">******</span>
    // A zero balance is an amount like any other and renders as "0".
    if (currencyBalance) return <Balance balance={currencyBalance} />
    if (showLoading)
      return <Skeleton width={balanceSkeletonWidth} height={18} className="my-[3px]" variant="darkSubtle" />
    return (
      <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-balance">
        {/* No wallet, nothing to hold; a wallet whose balance never arrived, nothing to claim. */}
        {balanceUnknown ? '--' : '0'}
      </span>
    )
  }
  const { symbol } = getDisplayTokenInfo(currency)

  const ageBadge = formatAgeBadge(addedAt)

  const rowInner = (
    <>
      <HStack className={cn('min-w-0 flex-1 items-center gap-2', isImport && 'opacity-50')}>
        {showFavoriteIcon &&
          (canFavorite ? (
            <Star
              onClick={e => onToggleFavorite?.(e, currency)}
              data-active={isFavorite}
              data-testid="button-favorite-token"
              role="button"
              className="size-4 shrink-0 text-subText hover:text-primary data-[active=true]:fill-current data-[active=true]:text-primary"
            />
          ) : (
            <div className="size-4 shrink-0" />
          ))}

        <div className="shrink-0">
          <CurrencyLogo currency={currency} size="24px" />
        </div>
        <Stack className="min-w-0 gap-0.5">
          <HStack className="min-w-0 items-center gap-1">
            <span
              title={currency.name}
              className="truncate text-xs font-normal text-text sm:text-sm"
              data-testid="token-symbol"
            >
              {customName || symbol}
            </span>
            {onShowTokenInfo && (
              <Info
                role="button"
                data-testid="button-token-info"
                onClick={e => {
                  e.stopPropagation()
                  onShowTokenInfo(currency.wrapped)
                }}
                size={14}
                className="shrink-0 text-subText hover:text-text"
              />
            )}
            {ageBadge && (
              <span
                className="shrink-0 rounded bg-blue/20 px-1 text-[10px] font-medium leading-4 text-blue"
                data-testid="token-age-badge"
              >
                {ageBadge}
              </span>
            )}
            {held && (
              <span
                className="shrink-0 rounded bg-primary-20 px-1 text-[10px] font-medium leading-4 text-primary"
                data-testid="token-held-badge"
              >
                <Trans>In wallet</Trans>
              </span>
            )}
            {impersonator && (
              <MouseoverTooltip
                placement="top"
                text={t`This token uses the symbol of a verified token but a different contract address. Check the address before selecting it.`}
              >
                <AlertTriangle size={14} className="shrink-0 text-warning" data-testid="token-impersonator-warning" />
              </MouseoverTooltip>
            )}
          </HStack>
          <HStack className="min-w-0 items-center gap-1 text-xs text-gray">
            <span title={nativeCurrency?.name} className="truncate" data-testid="token-name">
              {nativeCurrency?.name}
            </span>
            {showCopyAddress && !isTokenNative(currency) && (
              <span className="group relative flex shrink-0 items-center">
                <CopyHelper
                  toCopy={currency.wrapped.address}
                  size={14}
                  margin="0"
                  className="text-gray hover:text-text"
                  data-testid="copy-token-address"
                />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%+4px)] left-0 z-10 hidden whitespace-nowrap rounded bg-tableHeader px-1.5 py-0.5 font-mono text-[10px] font-medium text-text shadow-[0px_2px_8px_rgba(0,0,0,0.4)] group-hover:block"
                >
                  {currency.wrapped.address}
                </span>
              </span>
            )}
            {showAddress && (
              <>
                <span className="shrink-0">•</span>
                {isTokenNative(currency) ? (
                  <span className="shrink-0">
                    <Trans>Native</Trans>
                  </span>
                ) : (
                  <AddressCopy chainId={currency.chainId} address={currency.wrapped.address} />
                )}
              </>
            )}
          </HStack>
        </Stack>
      </HStack>

      <HStack className="shrink-0 items-center gap-3 justify-self-end">
        {showPriceColumn && (
          <Stack className={cn('w-[72px] items-end gap-0.5 overflow-hidden sm:w-[132px]', isImport && 'opacity-50')}>
            <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-price">
              {priceUsd ? formatDisplayNumber(priceUsd, { style: 'currency', significantDigits: 6 }) : '--'}
            </span>
            {priceChange24h !== undefined && (
              <span
                className={cn('text-xs', priceChange24h >= 0 ? 'text-primary' : 'text-red')}
                data-testid="token-price-change"
              >
                {priceChange24h >= 0 ? '+' : '-'}
                {formatDisplayNumber(Math.abs(priceChange24h) / 100, { style: 'percent', fractionDigits: 2 })}
              </span>
            )}
          </Stack>
        )}

        {isImport ? (
          <Stack className={cn('items-end overflow-hidden', rightColumnClassName)}>
            <ButtonPrimary
              data-testid="button-import-token"
              width="fit-content"
              padding="6px 16px"
              fontWeight={500}
              fontSize="14px"
              className="transition"
              onClick={e => {
                e.stopPropagation()
                onImportToken?.(currency.wrapped)
              }}
            >
              <Trans>Import</Trans>
            </ButtonPrimary>
          </Stack>
        ) : rightColumn === 'metric' ? (
          <Stack className={cn('items-end overflow-hidden', rightColumnClassName)}>
            <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-metric">
              {/* Only a missing metric reads "--"; a real zero is data and renders as an amount. */}
              {metricValue === undefined ? '--' : formatBigLiquidity(String(metricValue), 2, true)}
            </span>
          </Stack>
        ) : (
          <Stack className={cn('items-end gap-0.5 overflow-hidden', rightColumnClassName)}>
            {customBalance !== undefined ? customBalance : renderBalance()}
            {!!usdBalance && !hideBalance && (
              <span className={cn('text-xs', usdValueClassName)} data-testid="token-usd-value">
                {formatDisplayNumber(usdBalance, { style: 'currency', significantDigits: 4 })}
              </span>
            )}
          </Stack>
        )}
        {onRemoveImportedToken && (
          <div className="flex w-6 shrink-0 items-center justify-center">
            <X
              onClick={onClickRemove}
              data-testid="button-remove-import-token"
              className="size-4 shrink-0 cursor-pointer text-subText hover:text-text"
            />
          </div>
        )}
      </HStack>
    </>
  )

  if (warned) {
    return (
      <Stack
        data-testid="token-item"
        data-restricted="true"
        style={style}
        className="justify-center gap-0.5 rounded-lg bg-warning/[0.08] px-0.5"
      >
        <HStack className="pointer-events-none h-12 w-full items-center justify-between gap-3 px-3 opacity-50">
          {rowInner}
        </HStack>
        <span className="px-3 pb-1 text-xs font-medium text-warning" data-testid="restricted-token-notice">
          {restrictedTokenMessage()}
        </span>
      </Stack>
    )
  }

  const activate = () => {
    if (restricted) {
      onRestrictedClick?.()
      return
    }
    if (isImport || importOnClick) {
      onImportToken?.(currency.wrapped)
      return
    }
    onSelect?.(currency)
  }

  return (
    <HStack
      data-testid="token-item"
      data-selected={isSelected || otherSelected}
      role="button"
      tabIndex={0}
      aria-label={symbol}
      style={style}
      onClick={activate}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
      onMouseEnter={e => {
        if (hoverColor && window.matchMedia('(hover: hover)').matches) {
          e.currentTarget.style.background = hoverColor
        }
      }}
      onMouseLeave={e => {
        if (hoverColor) {
          e.currentTarget.style.background = ''
        }
      }}
      className={cn(
        'flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1 sm:gap-3',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:bg-primary-20',
        // Not-yet-imported token: keep the row normal but dimmed to 50% to hint it needs importing.
        importOnClick && 'opacity-50',
        !hoverColor &&
          '[@media(hover:hover)]:hover:bg-primary-15 [@media(hover:hover)]:data-[selected=true]:hover:bg-primary-25',
      )}
    >
      {rowInner}
    </HStack>
  )
}
