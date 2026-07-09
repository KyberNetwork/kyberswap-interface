import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { CSSProperties, ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info, Star, X } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { ListChildComponentProps, VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import Skeleton from 'components/Skeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { getDisplayTokenInfo } from 'components/TokenSelectorModal/PinnedTokens'
import { TokenRowExtra, TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { getNeedsImport } from 'components/TokenSelectorModal/utils'
import { useActiveWeb3React } from 'hooks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { restrictedTokenKey, restrictedTokenMessage, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { shortenAddress } from 'utils'
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
// Stable empties so gated balance/price subscriptions never allocate a fresh array to disable them.
const EMPTY_CURRENCIES: Currency[] = []
const EMPTY_ADDRESSES: string[] = []

const Balance = ({ balance }: { balance: CurrencyAmount<Currency> }) => {
  return (
    <span className="max-w-full truncate text-sm text-text" data-testid="token-balance" title={balance.toExact()}>
      {balance.toSignificant(10)}
    </span>
  )
}

// Compact "age since whitelisted" badge for the New tab, e.g. "NEW", "1D", "3D".
const formatAgeBadge = (addedAt?: number): string | null => {
  if (!addedAt) return null
  const days = Math.floor(Date.now() / 1000 / 86400 - addedAt / 86400)
  return days <= 0 ? 'NEW' : `${days}D`
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
  volume24h?: number
  addedAt?: number
  showAddress?: boolean
  usdValueClassName?: string
  /** Render the fixed-width price / 24h-change column. Kept tab-level (not data-driven) so rows stay aligned. */
  showPriceColumn?: boolean
  /**
   * What the right column renders: the wallet 'balance' (default), 24h 'volume' (Trending), or an
   * 'import' button for a not-yet-imported token (which also makes the whole row trigger import).
   */
  rightColumn?: 'balance' | 'volume' | 'import'
  /** Start the import flow for a not-yet-imported token (used when `rightColumn` is 'import'). */
  onImportToken?: (token: Token) => void
  /** Restricted in the user's jurisdiction: clicking the row reveals the inline notice instead of selecting. */
  restricted?: boolean
  /** Whether the inline "not available" notice is currently expanded for this row. */
  warned?: boolean
  /** Reveal the inline restricted notice (called on a restricted row's click). */
  onRestrictedClick?: () => void
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
  volume24h,
  addedAt,
  showAddress,
  usdValueClassName = 'text-subText',
  showPriceColumn,
  rightColumn = 'balance',
  onImportToken,
  restricted,
  warned,
  onRestrictedClick,
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
    if (hideBalance) return <span className="max-w-full truncate text-sm text-text">******</span>
    // Connected wallet: show the balance (a zero balance renders as "0"). With no wallet, currencyBalance
    // is undefined and showLoading is false, so it falls through to "-".
    if (currencyBalance) return <Balance balance={currencyBalance} />
    if (showLoading)
      return <Skeleton width={balanceSkeletonWidth} height={18} className="my-[3px]" variant="darkSubtle" />
    return (
      <span className="max-w-full truncate text-sm text-text" data-testid="token-balance">
        -
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
            <span title={currency.name} className="truncate text-sm font-normal text-text" data-testid="token-symbol">
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
          </HStack>
          <HStack className="min-w-0 items-center gap-1 text-xs text-gray">
            <span title={nativeCurrency?.name} className="truncate" data-testid="token-name">
              {nativeCurrency?.name}
            </span>
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
          <Stack className={cn('w-[104px] items-end gap-0.5 overflow-hidden', isImport && 'opacity-50')}>
            <span className="max-w-full truncate text-sm text-text" data-testid="token-price">
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
          <Stack className="w-[104px] items-end overflow-hidden">
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
        ) : rightColumn === 'volume' ? (
          <Stack className="w-[104px] items-end overflow-hidden">
            <span className="max-w-full truncate text-sm text-text" data-testid="token-volume">
              {volume24h ? formatBigLiquidity(String(volume24h), 2, true) : '--'}
            </span>
          </Stack>
        ) : (
          <Stack className="w-[104px] items-end gap-0.5 overflow-hidden">
            {customBalance !== undefined ? customBalance : renderBalance()}
            {!!usdBalance && !hideBalance && (
              <span className={cn('text-xs', usdValueClassName)} data-testid="token-usd-value">
                {formatDisplayNumber(usdBalance, { style: 'currency', significantDigits: 4 })}
              </span>
            )}
          </Stack>
        )}
        {onRemoveImportedToken && (
          <X
            onClick={onClickRemove}
            data-testid="button-remove-import-token"
            className="size-4 shrink-0 text-subText hover:text-text"
          />
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
    if (isImport) {
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
        'flex h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:bg-primary-20',
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
  showPriceColumn?: boolean
  showVolume?: boolean
  importedAddressSet: Set<string>
  tokenPrices: { [address: string]: number }
  account?: string | null
  favoriteAddressSet: Set<string>
  extras?: TokenRowExtraMap
  isTokenRestricted: (currency?: Currency | null) => boolean
  warnedKeys: Set<string>
  onWarnRestricted: (key: string) => void
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

  // Not whitelisted and not yet imported: keep the row's data but swap the right column for an Import button.
  const needsImport = getNeedsImport(currency, address => data.importedAddressSet.has(address), !!data.onImportToken)
  const rightColumn = needsImport ? 'import' : data.showVolume ? 'volume' : 'balance'

  const isSelected = Boolean(data.selectedCurrency?.equals(currency))
  const otherSelected = Boolean(data.otherCurrency?.equals(currency))

  const favoriteTokenAddress = currency.isToken ? (currency as Token).address : undefined
  const isFavorite = favoriteTokenAddress ? data.favoriteAddressSet.has(favoriteTokenAddress.toLowerCase()) : false

  const currencyBalance = data.currencyBalances[index]
  const extra: TokenRowExtra | undefined = data.extras?.[tokenRowKey(currency.chainId, token.address)]
  // Non-All tabs already carry price in the catalog extras; only the All tab fetches Redux prices.
  const priceForUsd = data.showPriceColumn ? extra?.price ?? 0 : data.tokenPrices[token.address] || 0
  const usdBalance = priceForUsd * parseFloat(currencyBalance?.toExact() || '0')

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
        isSelected={isSelected}
        showFavoriteIcon={data.showFavoriteIcon}
        onSelect={data.onCurrencySelect}
        otherSelected={otherSelected}
        onShowTokenInfo={data.onShowTokenInfo}
        usdBalance={usdBalance}
        usdValueClassName="text-primary"
        priceUsd={extra?.price}
        priceChange24h={extra?.priceChange24h}
        volume24h={extra?.volume24h}
        addedAt={extra?.addedAt}
        showAddress={data.showAddress}
        showPriceColumn={data.showPriceColumn}
        rightColumn={rightColumn}
        onImportToken={data.onImportToken}
        restricted={restricted}
        warned={warned}
        onRestrictedClick={() => data.onWarnRestricted(restrictedKey)}
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
  onShowTokenInfo?: (token: Token) => void
  /** Per-token price / 24h change / volume / added-at metadata keyed by `${chainId}-${address}`. */
  extras?: TokenRowExtraMap
  /** Show the shortened, click-to-copy token address next to each name (All tab). */
  showAddress?: boolean
  /** Render the price / 24h-change column (every tab except All). */
  showPriceColumn?: boolean
  /** Right column shows 24h volume instead of balance (Trending). */
  showVolume?: boolean
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
  onShowTokenInfo,
  extras,
  showAddress,
  showPriceColumn,
  showVolume,
}: TokenListProps) => {
  const { account } = useActiveWeb3React()
  const { favoriteTokens } = useUserFavoriteTokens(customChainId)
  const tokenImports = useUserAddedTokens(customChainId)

  // Only the All tab derives USD sub-lines from Redux prices (the others read price from catalog
  // extras), so skip the /prices fetch elsewhere. Trending shows volume, not balance, so skip its
  // per-block balanceOf multicall entirely.
  const priceAddresses = useMemo(
    () => (showPriceColumn ? EMPTY_ADDRESSES : currencies.map(currency => currency.wrapped.address)),
    [showPriceColumn, currencies],
  )
  const tokenPrices = useTokenPrices(priceAddresses, customChainId)
  const balanceCurrencies = showVolume ? EMPTY_CURRENCIES : currencies
  const currencyBalances = useCurrencyBalances(balanceCurrencies, customChainId)

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
      showPriceColumn,
      showVolume,
      importedAddressSet,
      tokenPrices,
      account,
      favoriteAddressSet,
      extras,
      isTokenRestricted,
      warnedKeys,
      onWarnRestricted,
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
      showPriceColumn,
      showVolume,
      importedAddressSet,
      tokenPrices,
      account,
      favoriteAddressSet,
      extras,
      isTokenRestricted,
      warnedKeys,
      onWarnRestricted,
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
