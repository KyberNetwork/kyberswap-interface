import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { CSSProperties, ReactNode, memo, useCallback } from 'react'
import { Info, Star, X } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import Skeleton from 'components/Skeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { getDisplayTokenInfo } from 'components/TokenSelectorModal/PinnedTokens'
import { TokenRowExtra, TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { useActiveWeb3React } from 'hooks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { shortenAddress } from 'utils'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatBigLiquidity } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'
import { isTokenNative } from 'utils/tokenInfo'

const Balance = ({ balance }: { balance: CurrencyAmount<Currency> }) => {
  return (
    <span className="max-w-full truncate text-sm text-text" title={balance.toExact()}>
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
    return <span className="max-w-full truncate text-sm text-text">-</span>
  }
  const { symbol } = getDisplayTokenInfo(currency)

  const ageBadge = formatAgeBadge(addedAt)

  return (
    <HStack
      data-testid="token-item"
      data-selected={isSelected || otherSelected}
      role="button"
      style={style}
      onClick={() => {
        if (isImport) {
          onImportToken?.(currency.wrapped)
          return
        }
        onSelect?.(currency)
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
        'data-[selected=true]:bg-primary-20',
        !hoverColor &&
          '[@media(hover:hover)]:hover:bg-primary-15 [@media(hover:hover)]:data-[selected=true]:hover:bg-primary-25',
      )}
    >
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
              <span className="shrink-0 rounded bg-blue/20 px-1 text-[10px] font-medium leading-4 text-blue">
                {ageBadge}
              </span>
            )}
          </HStack>
          <HStack className="min-w-0 items-center gap-1 text-xs text-gray">
            <span title={nativeCurrency?.name} className="truncate">
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
            <span className="max-w-full truncate text-sm text-text">
              {priceUsd ? formatDisplayNumber(priceUsd, { style: 'currency', significantDigits: 6 }) : '--'}
            </span>
            {priceChange24h !== undefined && (
              <span className={cn('text-xs', priceChange24h >= 0 ? 'text-primary' : 'text-red')}>
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
            <span className="max-w-full truncate text-sm text-text">
              {volume24h ? formatBigLiquidity(String(volume24h), 2, true) : '--'}
            </span>
          </Stack>
        ) : (
          <Stack className="w-[104px] items-end gap-0.5 overflow-hidden">
            {customBalance !== undefined ? customBalance : renderBalance()}
            {!!usdBalance && !hideBalance && (
              <span className={cn('text-xs', usdValueClassName)}>
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
    </HStack>
  )
}

type VirtualTokenRowProps = {
  currency: Currency | undefined
  currencyBalance?: CurrencyAmount<Currency>
  index: number
  style: CSSProperties
}

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
  itemStyle = {},
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

  const tokenPrices = useTokenPrices(
    currencies.map(currency => currency.wrapped.address),
    customChainId,
  )
  const currencyBalances = useCurrencyBalances(currencies, customChainId)

  const Row = useCallback(
    ({ style, currency, currencyBalance }: VirtualTokenRowProps) => {
      if (!currency) return null

      const extendCurrency = currency as WrappedTokenInfo
      const token = currency.wrapped
      const isWhitelisted = !!extendCurrency?.isWhitelisted

      // Not whitelisted and not yet imported: keep the row's data but swap the right column for an Import button.
      const needsImport =
        !isWhitelisted &&
        !tokenImports.find(importedToken => importedToken.address === token.address) &&
        !isTokenNative(currency) &&
        !!onImportToken
      const rightColumn = needsImport ? 'import' : showVolume ? 'volume' : 'balance'

      const isSelected = Boolean(selectedCurrency?.equals(currency))
      const otherSelected = Boolean(otherCurrency?.equals(currency))

      const favoriteTokenAddress = currency.isToken ? (currency as Token).address : undefined
      const isFavorite = favoriteTokenAddress
        ? !!favoriteTokens?.includes(favoriteTokenAddress) ||
          !!favoriteTokens?.includes(favoriteTokenAddress.toLowerCase())
        : false

      const tokenPrice = tokenPrices[token.address] || 0
      const usdBalance = tokenPrice * parseFloat(currencyBalance?.toExact() || '0')
      const extra: TokenRowExtra | undefined = extras?.[tokenRowKey(currency.chainId, token.address)]

      return (
        <TokenRow
          isFavorite={isFavorite}
          showLoading={!!account}
          onToggleFavorite={onToggleFavorite}
          onRemoveImportedToken={onRemoveImportedToken}
          style={{ ...style, ...itemStyle }}
          currency={currency}
          currencyBalance={currencyBalance}
          isSelected={isSelected}
          showFavoriteIcon={showFavoriteIcon}
          onSelect={onCurrencySelect}
          otherSelected={otherSelected}
          onShowTokenInfo={onShowTokenInfo}
          usdBalance={usdBalance}
          usdValueClassName="text-primary"
          priceUsd={extra?.price}
          priceChange24h={extra?.priceChange24h}
          volume24h={extra?.volume24h}
          addedAt={extra?.addedAt}
          showAddress={showAddress}
          showPriceColumn={showPriceColumn}
          rightColumn={rightColumn}
          onImportToken={onImportToken}
        />
      )
    },
    [
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      onImportToken,
      onToggleFavorite,
      onRemoveImportedToken,
      itemStyle,
      showFavoriteIcon,
      tokenImports,
      tokenPrices,
      account,
      favoriteTokens,
      onShowTokenInfo,
      extras,
      showAddress,
      showPriceColumn,
      showVolume,
    ],
  )

  const loadMoreItems = useCallback(() => loadMoreRows?.(), [loadMoreRows])
  const itemCount = hasMore ? currencies.length + 1 : currencies.length // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const isItemLoaded = (index: number) => !hasMore || index < currencies.length

  return (
    <div className="flex-1 pb-2">
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreItems} threshold={3}>
            {({ onItemsRendered, ref }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemCount={itemCount}
                itemSize={12 * 4 + 8}
                onItemsRendered={onItemsRendered}
                ref={ref}
                outerRef={listTokenRef}
              >
                {({ index, style }: { index: number; style: CSSProperties }) => {
                  if (!isItemLoaded(index)) {
                    return (
                      <div className="px-2 pt-2" style={style}>
                        <Center className="h-14">
                          <Loader size="20px" />
                        </Center>
                      </div>
                    )
                  }
                  return (
                    <div className="px-2 pt-2" style={style}>
                      <Row
                        index={index}
                        currency={currencies[index]}
                        key={currencies[index]?.wrapped.address || index}
                        currencyBalance={currencyBalances[index]}
                        style={{ height: 12 * 4 }}
                      />
                    </div>
                  )
                }}
              </FixedSizeList>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </div>
  )
}

export default memo(TokenList)
