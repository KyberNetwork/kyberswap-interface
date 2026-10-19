import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import React, { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import { VirtualRow, VirtualRowData } from 'components/TokenSelectorModal/VirtualTokenRow'
import {
  NORMAL_ITEM_SIZE,
  RESTRICTED_ITEM_SIZE,
  ROWS_RENDERED_DEBOUNCE_MS,
  ROWS_RENDERED_MARGIN,
} from 'components/TokenSelectorModal/constants'
import { TokenMetricColumn, TokenRowExtraMap } from 'components/TokenSelectorModal/types'
import { useActiveWeb3React } from 'hooks'
import { restrictedTokenKey, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { getTokenAddress, isTokenNative } from 'utils/tokenInfo'

// Stable default so an omitted `itemStyle` prop doesn't mint a new object each render (which would
// churn the row data bag and re-render every row).
const EMPTY_ITEM_STYLE: CSSProperties = {}
// Stable empties so a gated price subscription / balance column never allocates a fresh array to
// disable itself.
const EMPTY_BALANCES: (CurrencyAmount<Currency> | undefined)[] = []
const EMPTY_ADDRESSES: string[] = []

type Props = {
  showFavoriteIcon?: boolean
  hasMore?: boolean
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  otherCurrency?: Currency | null
  /** Show the selected tokens' ERC-8056 balances in display units; only for forms whose own balance labels do the same. */
  scaleERC8056Balances?: boolean
  onImportToken?: (token: Token) => void
  onToggleFavorite?: (event: React.MouseEvent, currency: Currency) => void
  onRemoveImportedToken?: (token: Token) => void
  loadMoreRows?: () => Promise<void>
  /**
   * Called, debounced, with the currencies in and just around the viewport whenever it moves, so a
   * caller can fetch per-row data (catalog metadata) for what is about to be looked at only.
   */
  onRowsRendered?: (currencies: Currency[]) => void
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
  /** Right column shows this metric — 24h volume or FDV — instead of the balance (Trending / New). */
  metricColumn?: TokenMetricColumn
  /** Render a not-yet-imported token as a normal row dimmed to 50% (click imports) instead of an Import button (Trending / All). */
  importAsRow?: boolean
  /** Addresses to flag as borrowing a whitelisted token's symbol; see `TokenRowProps.impersonator`. */
  impersonators?: Set<string>
  /** Addresses the wallet holds; only passed while searching, see `TokenRowProps.held`. */
  heldAddresses?: Set<string>
  /** Whether a balance still missing is worth showing as loading; see `useBalanceWait`. */
  waitingForBalances?: boolean
}

const TokenList = ({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  scaleERC8056Balances,
  onImportToken,
  onToggleFavorite,
  onRemoveImportedToken,
  loadMoreRows,
  onRowsRendered,
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
  waitingForBalances,
}: Props) => {
  const { account } = useActiveWeb3React()
  const { favoriteTokens } = useUserFavoriteTokens(customChainId)
  const tokenImports = useUserAddedTokens(customChainId)

  // Row-aligned view of the shared balance map. The metric tabs show volume / FDV rather than
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
      scaleERC8056Balances,
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
      waitingForBalances,
    }),
    [
      currencies,
      currencyBalances,
      selectedCurrency,
      otherCurrency,
      scaleERC8056Balances,
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
      waitingForBalances,
    ],
  )

  const loadMoreItems = useCallback(() => loadMoreRows?.(), [loadMoreRows])
  const itemCount = hasMore ? currencies.length + 1 : currencies.length // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const isItemLoaded = (index: number) => !hasMore || index < currencies.length

  const rowsRenderedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handleItemsRendered = useCallback(
    (range: { visibleStartIndex: number; visibleStopIndex: number }) => {
      if (!onRowsRendered) return
      if (rowsRenderedTimer.current) clearTimeout(rowsRenderedTimer.current)
      rowsRenderedTimer.current = setTimeout(() => {
        const start = Math.max(0, range.visibleStartIndex - ROWS_RENDERED_MARGIN)
        onRowsRendered(currencies.slice(start, range.visibleStopIndex + ROWS_RENDERED_MARGIN + 1))
      }, ROWS_RENDERED_DEBOUNCE_MS)
    },
    [onRowsRendered, currencies],
  )
  useEffect(() => () => clearTimeout(rowsRenderedTimer.current), [])

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
                onItemsRendered={range => {
                  onItemsRendered(range)
                  handleItemsRendered(range)
                }}
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
