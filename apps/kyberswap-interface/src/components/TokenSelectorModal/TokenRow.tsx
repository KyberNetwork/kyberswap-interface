import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { type CSSProperties, type ReactNode } from 'react'

import { getDisplayTokenInfo } from 'components/TokenSelectorModal/PinnedTokens'
import { TokenRowIdentity } from 'components/TokenSelectorModal/TokenRowIdentity'
import { TokenRowValues } from 'components/TokenSelectorModal/TokenRowValues'
import { restrictedTokenMessage } from 'hooks/useRestrictedTokens'
import { cn } from 'utils/cn'

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
  rightColumnClassName,
  importOnClick,
  onImportToken,
  restricted,
  warned,
  onRestrictedClick,
  impersonator,
  held,
}: TokenRowProps) => {
  const isImport = rightColumn === 'import'
  const { symbol } = getDisplayTokenInfo(currency)

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
    <div
      data-testid="token-item"
      data-selected={warned ? undefined : isSelected || otherSelected}
      data-restricted={warned ? 'true' : undefined}
      role={warned ? undefined : 'button'}
      tabIndex={warned ? undefined : 0}
      aria-label={symbol}
      style={style}
      onClick={warned ? undefined : activate}
      onKeyDown={e => {
        if (!warned && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          activate()
        }
      }}
      onMouseEnter={e => {
        if (!warned && hoverColor && window.matchMedia('(hover: hover)').matches) {
          e.currentTarget.style.background = hoverColor
        }
      }}
      onMouseLeave={e => {
        if (!warned && hoverColor) {
          e.currentTarget.style.background = ''
        }
      }}
      className={cn(
        warned
          ? 'flex flex-col justify-center gap-0.5 rounded-lg bg-warning/[0.08] px-0.5'
          : 'flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:bg-primary-20 sm:gap-3',
        !warned && importOnClick && 'opacity-50',
        !warned &&
          !hoverColor &&
          '[@media(hover:hover)]:hover:bg-primary-15 [@media(hover:hover)]:data-[selected=true]:hover:bg-primary-25',
      )}
    >
      <div
        className={cn(
          warned
            ? 'pointer-events-none flex h-12 w-full items-center justify-between gap-3 px-3 opacity-50'
            : 'contents',
        )}
      >
        <TokenRowIdentity
          currency={currency}
          isImport={isImport}
          showFavoriteIcon={showFavoriteIcon}
          canFavorite={canFavorite}
          isFavorite={isFavorite}
          customName={customName}
          addedAt={addedAt}
          held={held}
          impersonator={impersonator}
          showCopyAddress={showCopyAddress}
          showAddress={showAddress}
          onToggleFavorite={onToggleFavorite}
          onShowTokenInfo={onShowTokenInfo}
        />
        <TokenRowValues
          currency={currency}
          currencyBalance={currencyBalance}
          rightColumn={rightColumn}
          rightColumnClassName={rightColumnClassName}
          showPriceColumn={showPriceColumn}
          priceUsd={priceUsd}
          priceChange24h={priceChange24h}
          metricValue={metricValue}
          customBalance={customBalance}
          hideBalance={hideBalance}
          showLoading={showLoading}
          balanceUnknown={balanceUnknown}
          usdBalance={usdBalance}
          usdValueClassName={usdValueClassName}
          onImportToken={onImportToken}
          onRemoveImportedToken={onRemoveImportedToken}
        />
      </div>
      {warned && (
        <span className="px-3 pb-1 text-xs font-medium text-warning" data-testid="restricted-token-notice">
          {restrictedTokenMessage()}
        </span>
      )}
    </div>
  )
}
