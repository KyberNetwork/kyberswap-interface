import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { CSSProperties, ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Info, Star, X } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { ListChildComponentProps, VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import Skeleton from 'components/Skeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { getDisplayTokenInfo } from 'components/TokenSelectorModal/PinnedTokens'
import { Balance } from 'components/TokenSelectorModal/components'
import { BALANCE_COLUMN_CLASS, METRIC_COLUMN_CLASS } from 'components/TokenSelectorModal/constants'
import { TokenMetricColumn, TokenRowExtra, TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { getNeedsImport } from 'components/TokenSelectorModal/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useERC8056DisplayBalance, useERC8056TokenInfo } from 'hooks/useERC8056Token'
import { restrictedTokenKey, restrictedTokenMessage, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatBigLiquidity } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'
import { getTokenAddress, isTokenNative } from 'utils/tokenInfo'

// Virtualized row heights. A restricted row the user clicked grows to fit the "not available" notice.
const ROW_CONTENT_HEIGHT = 12 * 4 // 48px
const NORMAL_ITEM_SIZE = ROW_CONTENT_HEIGHT + 8 // 56px (content + row gap)
const RESTRICTED_CONTENT_HEIGHT = ROW_CONTENT_HEIGHT + 28 // 76px
const RESTRICTED_ITEM_SIZE = RESTRICTED_CONTENT_HEIGHT + 8 // 84px

// Stable default so an omitted `itemStyle` prop doesn't mint a new object each render (which would
// churn the row data bag and re-render every row).
const EMPTY_ITEM_STYLE: CSSProperties = {}
// Stable empties so a gated price subscription / balance column never allocates a fresh array to
// disable itself.
const EMPTY_BALANCES: (CurrencyAmount<Currency> | undefined)[] = []
const EMPTY_ADDRESSES: string[] = []

// Compact age badge for the New tab, counted from when the token was whitelisted: "NEW" under 12h,
// then hours ("15H") up to a day, then days ("3D").
const formatAgeBadge = (addedAt?: number): string | null => {
  if (!addedAt) return null
  const hours = Math.floor(Date.now() / 1000 / 3600 - addedAt / 3600)
  if (hours < 12) return 'NEW'
  if (hours < 24) return `${hours}H`
  return `${Math.floor(hours / 24)}D`
}

// Shortened token address shown next to the name on the All tab; click the text to copy.
const AddressCopy = ({ chainId, address }: { chainId: ChainId; address: string }) => {
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

type TokenRowProps = {
  showFavoriteIcon?: boolean
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
  isFavorite?: boolean
  onShowTokenInfo?: (token: Token) => void
  priceUsd?: number
  priceChange24h?: number
  /** USD value shown in the metric column — 24h volume or market cap, per the list's active metric. */
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
   * market cap (Trending / New) — or an 'import' button for a not-yet-imported token (which also makes
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
  /**
   * What the slot after the balance column holds: an import icon for a held token that is not yet
   * on the list, or an equally wide spacer so every row's balance stays aligned with the ones that
   * have the icon. The Imported tab's remove button lives in the same slot.
   */
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
  customName,
  customBalance,
  usdBalance,
  hoverColor,
  hideBalance,
  showLoading,
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
    // Connected wallet: show the balance (a zero balance renders as "0"). With no wallet, currencyBalance
    // is undefined and showLoading is false, so it falls through to "0".
    if (currencyBalance) return <Balance balance={currencyBalance} />
    if (showLoading)
      return <Skeleton width={balanceSkeletonWidth} height={18} className="my-[3px]" variant="darkSubtle" />
    return (
      <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-balance">
        0
      </span>
    )
  }
  const { symbol } = getDisplayTokenInfo(currency)

  const ageBadge = formatAgeBadge(addedAt)

  const rowInner = (
    <>
      <HStack className={cn('min-w-0 flex-1 items-center gap-2', isImport && 'opacity-50')}>
        {showFavoriteIcon && (
          <Star
            onClick={e => onToggleFavorite?.(e, currency)}
            data-active={isFavorite}
            data-testid="button-favorite-token"
            role="button"
            className="size-4 shrink-0 text-subText hover:text-primary data-[active=true]:fill-current data-[active=true]:text-primary"
          />
        )}

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
              <CopyHelper
                toCopy={currency.wrapped.address}
                size={14}
                margin="0"
                className="text-gray hover:text-text"
                data-testid="copy-token-address"
              />
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

// Data bag handed to every virtualized row through react-window's `itemData`. Delivering row data
// as a prop (rather than closing over it in an inline render-prop) keeps the row's element type
// stable, so background price/balance polls re-render rows cheaply instead of remounting them.
type VirtualRowData = {
  currencies: Currency[]
  currencyBalances: (CurrencyAmount<Currency> | undefined)[]
  selectedCurrency?: Currency | null
  otherCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  onImportToken?: (token: Token) => void
  onToggleFavorite?: (event: React.MouseEvent, currency: Currency) => void
  onRemoveImportedToken?: (token: Token) => void
  onShowTokenInfo?: (token: Token) => void
  showFavoriteIcon?: boolean
  itemStyle: CSSProperties
  showAddress?: boolean
  showCopyAddress?: boolean
  showPriceColumn?: boolean
  metricColumn?: TokenMetricColumn
  importAsRow?: boolean
  importedAddressSet: Set<string>
  tokenPrices: { [address: string]: number }
  account?: string | null
  favoriteAddressSet: Set<string>
  extras?: TokenRowExtraMap
  isTokenRestricted: (currency?: Currency | null) => boolean
  warnedKeys: Set<string>
  onWarnRestricted: (key: string) => void
  impersonators?: Set<string>
  heldAddresses?: Set<string>
}

const SelectedTokenBalance = ({ currency, balance }: { currency: Currency; balance: CurrencyAmount<Currency> }) => {
  const info = useERC8056TokenInfo(currency, currency.chainId)
  const displayBalance = useERC8056DisplayBalance(info, balance)

  return <Balance balance={displayBalance ?? balance} />
}

const VirtualRow = memo(function VirtualRow({ index, style, data }: ListChildComponentProps<VirtualRowData>) {
  const currency = data.currencies[index]
  // The trailing slot (present while more pages can load) has no currency yet — show the loader.
  if (!currency) {
    return (
      <div className="px-2 pt-2" style={style} data-testid="token-list-load-more">
        <Center className="h-12">
          <Loader size="20px" />
        </Center>
      </div>
    )
  }

  const token = currency.wrapped

  // Not whitelisted and not yet imported. Without `importAsRow` (Favorites, or while searching) the
  // right column becomes an Import button; with `importAsRow` (Trending / All, not searching) the row
  // stays normal — dimmed to 50% — and clicking it imports.
  const needsImport = getNeedsImport(currency, address => data.importedAddressSet.has(address), !!data.onImportToken)
  // A held token found by search keeps its balance column (dimmed, click imports) rather than turning
  // into an Import button: the balance is the very thing that tells the user this is the one they own.
  const held = !!data.heldAddresses?.has(getTokenAddress(currency))
  const importAsRow = needsImport && (!!data.importAsRow || held)
  const rightColumn = needsImport && !importAsRow ? 'import' : data.metricColumn ? 'metric' : 'balance'

  const isSelected = Boolean(data.selectedCurrency?.equals(currency))
  const otherSelected = Boolean(data.otherCurrency?.equals(currency))

  const favoriteTokenAddress = currency.isToken ? (currency as Token).address : undefined
  const isFavorite = favoriteTokenAddress ? data.favoriteAddressSet.has(favoriteTokenAddress.toLowerCase()) : false

  const currencyBalance = data.currencyBalances[index]
  const extra: TokenRowExtra | undefined = data.extras?.[tokenRowKey(currency.chainId, token.address)]
  // Non-All tabs already carry price in the catalog extras; only the All tab fetches Redux prices.
  const priceForUsd = data.showPriceColumn ? extra?.price ?? 0 : data.tokenPrices[token.address] || 0
  const usdBalance = priceForUsd * parseFloat(currencyBalance?.toExact() || '0')
  const customBalance =
    currency.isToken && currencyBalance && (isSelected || otherSelected) ? (
      <SelectedTokenBalance currency={currency} balance={currencyBalance} />
    ) : undefined

  const restrictedKey = restrictedTokenKey(currency.chainId, getTokenAddress(currency))
  const restricted = data.isTokenRestricted(currency)
  const warned = restricted && data.warnedKeys.has(restrictedKey)
  const rowStyle: CSSProperties = { height: warned ? RESTRICTED_CONTENT_HEIGHT : ROW_CONTENT_HEIGHT, ...data.itemStyle }

  return (
    <div className="px-2 pt-2" style={style}>
      <TokenRow
        isFavorite={isFavorite}
        showLoading={!!data.account}
        onToggleFavorite={data.onToggleFavorite}
        onRemoveImportedToken={data.onRemoveImportedToken}
        style={rowStyle}
        currency={currency}
        currencyBalance={currencyBalance}
        customBalance={customBalance}
        isSelected={isSelected}
        showFavoriteIcon={data.showFavoriteIcon}
        onSelect={data.onCurrencySelect}
        otherSelected={otherSelected}
        onShowTokenInfo={data.onShowTokenInfo}
        usdBalance={usdBalance}
        usdValueClassName="text-primary"
        priceUsd={extra?.price}
        priceChange24h={extra?.priceChange24h}
        metricValue={data.metricColumn ? extra?.[data.metricColumn] : undefined}
        addedAt={extra?.addedAt}
        showAddress={data.showAddress}
        showCopyAddress={data.showCopyAddress}
        showPriceColumn={data.showPriceColumn}
        rightColumn={rightColumn}
        rightColumnClassName={data.metricColumn ? METRIC_COLUMN_CLASS : BALANCE_COLUMN_CLASS}
        importOnClick={importAsRow}
        onImportToken={data.onImportToken}
        restricted={restricted}
        warned={warned}
        onRestrictedClick={() => data.onWarnRestricted(restrictedKey)}
        impersonator={data.impersonators?.has(token.address)}
        held={held}
      />
    </div>
  )
})

type TokenListProps = {
  showFavoriteIcon?: boolean
  hasMore?: boolean
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  otherCurrency?: Currency | null
  onImportToken?: (token: Token) => void
  onToggleFavorite?: (event: React.MouseEvent, currency: Currency) => void
  onRemoveImportedToken?: (token: Token) => void
  loadMoreRows?: () => Promise<void>
  listTokenRef?: React.Ref<HTMLDivElement>
  itemStyle?: CSSProperties
  customChainId?: ChainId
  /** Wallet balances keyed by token address, owned by the parent so one multicall serves the whole modal. */
  balances?: { [tokenAddress: string]: TokenAmount | undefined }
  /** Wallet balance of the chain's native currency, which lives outside the ERC20 `balances` map. */
  nativeBalance?: CurrencyAmount<Currency>
  onShowTokenInfo?: (token: Token) => void
  /** Per-token price / 24h change / volume / added-at metadata keyed by `${chainId}-${address}`. */
  extras?: TokenRowExtraMap
  /** Show the shortened, click-to-copy token address next to each name (All tab). */
  showAddress?: boolean
  /** Show a copy-address icon next to each token name (every tab except All, which shows the address itself). */
  showCopyAddress?: boolean
  /** Render the price / 24h-change column (every tab except All). */
  showPriceColumn?: boolean
  /** Right column shows this metric — 24h volume or market cap — instead of the balance (Trending / New). */
  metricColumn?: TokenMetricColumn
  /** Render a not-yet-imported token as a normal row dimmed to 50% (click imports) instead of an Import button (Trending / All). */
  importAsRow?: boolean
  /** Addresses to flag as borrowing a whitelisted token's symbol; see `TokenRowProps.impersonator`. */
  impersonators?: Set<string>
  /** Addresses the wallet holds; only passed while searching, see `TokenRowProps.held`. */
  heldAddresses?: Set<string>
}

const TokenList = ({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  onImportToken,
  onToggleFavorite,
  onRemoveImportedToken,
  loadMoreRows,
  hasMore,
  listTokenRef,
  showFavoriteIcon,
  itemStyle = EMPTY_ITEM_STYLE,
  customChainId,
  balances,
  nativeBalance,
  onShowTokenInfo,
  extras,
  showAddress,
  showCopyAddress,
  showPriceColumn,
  metricColumn,
  importAsRow,
  impersonators,
  heldAddresses,
}: TokenListProps) => {
  const { account } = useActiveWeb3React()
  const { favoriteTokens } = useUserFavoriteTokens(customChainId)
  const tokenImports = useUserAddedTokens(customChainId)

  // Row-aligned view of the shared balance map. The metric tabs show volume / market cap rather than
  // a balance, so they read nothing.
  const currencyBalances = useMemo(
    () =>
      metricColumn
        ? EMPTY_BALANCES
        : currencies.map(currency => (isTokenNative(currency) ? nativeBalance : balances?.[currency.wrapped.address])),
    [metricColumn, currencies, balances, nativeBalance],
  )

  // Only the All tab derives USD sub-lines from Redux prices (the others read price from catalog
  // extras), so skip the /prices subscription elsewhere. Within the All tab, only a row holding a
  // non-zero balance can produce a non-zero USD value, so subscribe just those instead of the whole
  // chain whitelist.
  const priceAddresses = useMemo(() => {
    if (showPriceColumn) return EMPTY_ADDRESSES
    const held = currencies
      .filter((_, index) => currencyBalances[index]?.greaterThan('0'))
      .map(currency => currency.wrapped.address)
    return held.length ? held : EMPTY_ADDRESSES
  }, [showPriceColumn, currencies, currencyBalances])
  // Live tier: this is the surface where a frozen price sits visibly next to a fresh one elsewhere,
  // and the held-token narrowing above keeps the union to a single request.
  const tokenPrices = useTokenPrices(priceAddresses, customChainId)

  // O(1) row-level membership checks (exact-case for imports to match the address equality used
  // elsewhere; lowercased for favorites, which can be stored in either case).
  const importedAddressSet = useMemo(() => new Set(tokenImports.map(token => token.address)), [tokenImports])
  const favoriteAddressSet = useMemo(
    () => new Set((favoriteTokens ?? []).map(address => address.toLowerCase())),
    [favoriteTokens],
  )

  const isTokenRestricted = useIsTokenRestricted()
  const listRef = useRef<VariableSizeList | null>(null)
  // Keys of restricted rows the user clicked; each grows to reveal the inline "not available" notice.
  const [warnedKeys, setWarnedKeys] = useState<Set<string>>(() => new Set())

  const getItemSize = useCallback(
    (index: number) => {
      const currency = currencies[index]
      if (!currency) return NORMAL_ITEM_SIZE
      return warnedKeys.has(restrictedTokenKey(currency.chainId, getTokenAddress(currency)))
        ? RESTRICTED_ITEM_SIZE
        : NORMAL_ITEM_SIZE
    },
    [currencies, warnedKeys],
  )

  const onWarnRestricted = useCallback((key: string) => {
    setWarnedKeys(prev => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  // Re-measure only when the row order/set changes or a restricted row expands/collapses — not on
  // every background poll that hands us a new-but-equal `currencies` array, which would otherwise
  // drop all cached offsets and re-layout the whole list (a visible flicker).
  const rowsSignature = useMemo(() => currencies.map(currency => currency.wrapped.address).join(','), [currencies])
  useEffect(() => {
    listRef.current?.resetAfterIndex(0)
  }, [rowsSignature, warnedKeys])

  const itemData = useMemo<VirtualRowData>(
    () => ({
      currencies,
      currencyBalances,
      selectedCurrency,
      otherCurrency,
      onCurrencySelect,
      onImportToken,
      onToggleFavorite,
      onRemoveImportedToken,
      onShowTokenInfo,
      showFavoriteIcon,
      itemStyle,
      showAddress,
      showCopyAddress,
      showPriceColumn,
      metricColumn,
      importAsRow,
      importedAddressSet,
      tokenPrices,
      account,
      favoriteAddressSet,
      extras,
      isTokenRestricted,
      warnedKeys,
      onWarnRestricted,
      impersonators,
      heldAddresses,
    }),
    [
      currencies,
      currencyBalances,
      selectedCurrency,
      otherCurrency,
      onCurrencySelect,
      onImportToken,
      onToggleFavorite,
      onRemoveImportedToken,
      onShowTokenInfo,
      showFavoriteIcon,
      itemStyle,
      showAddress,
      showCopyAddress,
      showPriceColumn,
      metricColumn,
      importAsRow,
      importedAddressSet,
      tokenPrices,
      account,
      favoriteAddressSet,
      extras,
      isTokenRestricted,
      warnedKeys,
      onWarnRestricted,
      impersonators,
      heldAddresses,
    ],
  )

  const loadMoreItems = useCallback(() => loadMoreRows?.(), [loadMoreRows])
  const itemCount = hasMore ? currencies.length + 1 : currencies.length // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const isItemLoaded = (index: number) => !hasMore || index < currencies.length

  return (
    <div className="flex-1 pb-2" data-testid="token-list">
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreItems} threshold={3}>
            {({ onItemsRendered, ref }) => (
              <VariableSizeList
                height={height}
                width={width}
                itemCount={itemCount}
                itemSize={getItemSize}
                estimatedItemSize={NORMAL_ITEM_SIZE}
                itemData={itemData}
                onItemsRendered={onItemsRendered}
                ref={node => {
                  ref(node)
                  listRef.current = node
                }}
                outerRef={listTokenRef}
              >
                {VirtualRow}
              </VariableSizeList>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </div>
  )
}

export default memo(TokenList)
