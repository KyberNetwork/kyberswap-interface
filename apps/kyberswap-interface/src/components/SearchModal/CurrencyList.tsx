import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import React, { CSSProperties, ReactNode, memo, useCallback } from 'react'
import { Info, Star, Trash } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { getDisplayTokenInfo } from 'components/SearchModal/CommonBases'
import ImportRow from 'components/SearchModal/ImportRow'
import { useActiveWeb3React } from 'hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatDisplayNumber } from 'utils/numbers'
import { isTokenNative } from 'utils/tokenInfo'

const Balance = ({ balance, compact }: { balance: CurrencyAmount<Currency>; compact?: boolean }) => {
  return (
    <span className={cn(compact ? 'text-xs' : 'text-base max-md:text-sm')} title={balance.toExact()}>
      {balance.toSignificant(10)}
    </span>
  )
}

type CurrencyRowProps = {
  showImported?: boolean
  showFavoriteIcon?: boolean
  currency: Currency
  currencyBalance?: CurrencyAmount<Currency>
  onSelect?: (currency: Currency) => void
  isSelected: boolean
  otherSelected?: boolean
  style?: CSSProperties
  handleClickFavorite?: (event: React.MouseEvent, currency: Currency) => void
  removeImportedToken?: (token: Token) => void
  customName?: ReactNode
  customBalance?: ReactNode
  usdBalance?: number
  hoverColor?: string
  hideBalance?: boolean
  showLoading?: boolean
  isFavorite?: boolean
  setTokenToShowInfo?: (token: Token) => void
}

export const CurrencyRow = ({
  currency,
  showImported,
  currencyBalance,
  onSelect,
  isSelected,
  otherSelected,
  style = {},
  handleClickFavorite,
  removeImportedToken,
  showFavoriteIcon = true,
  customName,
  customBalance,
  usdBalance,
  hoverColor,
  hideBalance,
  showLoading,
  isFavorite,
  setTokenToShowInfo,
}: CurrencyRowProps) => {
  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)

  const onClickRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeImportedToken?.(currency as Token)
  }

  const renderBalance = (compact = false) => {
    if (hideBalance) return <span className={cn(compact ? 'text-xs' : 'text-base max-md:text-sm')}>******</span>
    if (currencyBalance) return <Balance balance={currencyBalance} compact={compact} />
    if (showLoading) return <Loader size={compact ? '12px' : undefined} strokeWidth={compact ? '2' : undefined} />
    return null
  }
  const { symbol } = getDisplayTokenInfo(currency)

  return (
    <div
      data-testid="token-item"
      data-selected={isSelected || otherSelected}
      role="button"
      style={style}
      onClick={() => onSelect?.(currency)}
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
        'flex h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-1',
        'data-[selected=true]:bg-primary-20',
        !hoverColor &&
          '[@media(hover:hover)]:hover:bg-primary-15 [@media(hover:hover)]:data-[selected=true]:hover:bg-primary-25',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showFavoriteIcon && (
          <Star
            onClick={e => handleClickFavorite?.(e, currency)}
            data-active={isFavorite}
            data-testid="button-favorite-token"
            role="button"
            className="size-4 text-subText hover:text-primary data-[active=true]:fill-current data-[active=true]:text-primary"
          />
        )}

        <CurrencyLogo currency={currency} size="24px" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span title={currency.name} className="font-medium" data-testid="token-symbol">
            {customName || symbol}
          </span>
          <div className="ml-0 max-w-full truncate text-xs font-light text-subText">
            {showImported ? renderBalance(true) : nativeCurrency?.name}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3 justify-self-end">
        {!showImported && (
          <div className="flex flex-col items-end gap-0.5">
            {customBalance !== undefined ? customBalance : renderBalance()}
            {usdBalance !== undefined && !hideBalance && (
              <span className="text-xs text-subText">
                {formatDisplayNumber(usdBalance, { style: 'currency', significantDigits: 4 })}
              </span>
            )}
          </div>
        )}
        {showImported && (
          <Trash
            onClick={onClickRemove}
            data-testid="button-remove-import-token"
            className="size-4 text-subText hover:text-text"
          />
        )}
        {setTokenToShowInfo && (
          <Info
            role="button"
            onClick={e => {
              e.stopPropagation()
              setTokenToShowInfo(currency.wrapped)
            }}
            size={16}
            className="text-subText hover:text-text"
          />
        )}
      </div>
    </div>
  )
}

type TokenRowProps = {
  currency: Currency | undefined
  currencyBalance?: CurrencyAmount<Currency>
  index: number
  style: CSSProperties
}

type CurrencyListProps = {
  showImported?: boolean
  showFavoriteIcon?: boolean
  hasMore?: boolean
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  otherCurrency?: Currency | null
  setImportToken?: (token: Token) => void
  handleClickFavorite?: (event: React.MouseEvent, currency: Currency) => void
  removeImportedToken?: (token: Token) => void
  loadMoreRows?: () => Promise<void>
  listTokenRef?: React.Ref<HTMLDivElement>
  itemStyle?: CSSProperties
  customChainId?: ChainId
  setTokenToShowInfo?: (token: Token) => void
}

const CurrencyList = ({
  currencies,
  selectedCurrency,
  showImported,
  onCurrencySelect,
  otherCurrency,
  setImportToken,
  handleClickFavorite,
  removeImportedToken,
  loadMoreRows,
  hasMore,
  listTokenRef,
  showFavoriteIcon,
  itemStyle = {},
  customChainId,
  setTokenToShowInfo,
}: CurrencyListProps) => {
  const { account } = useActiveWeb3React()
  const { favoriteTokens } = useUserFavoriteTokens(customChainId)
  const tokenImports = useUserAddedTokens(customChainId)

  const tokenPrices = useTokenPrices(
    currencies.map(currency => currency.wrapped.address),
    customChainId,
  )
  const currencyBalances = useCurrencyBalances(currencies, customChainId)

  const Row = useCallback(
    ({ style, currency, currencyBalance }: TokenRowProps) => {
      if (!currency) return null

      const extendCurrency = currency as WrappedTokenInfo
      const token = currency.wrapped
      const isWhitelisted = !!extendCurrency?.isWhitelisted

      const showImport =
        !isWhitelisted &&
        !tokenImports.find(importedToken => importedToken.address === token.address) &&
        !isTokenNative(currency)

      if (showImport && token && setImportToken) {
        return <ImportRow style={style} token={token} setImportToken={setImportToken} dim={true} />
      }

      const isSelected = Boolean(selectedCurrency?.equals(currency))
      const otherSelected = Boolean(otherCurrency?.equals(currency))

      const favoriteTokenAddress = currency.isToken ? (currency as Token).address : undefined
      const isFavorite = favoriteTokenAddress
        ? !!favoriteTokens?.includes(favoriteTokenAddress) ||
          !!favoriteTokens?.includes(favoriteTokenAddress.toLowerCase())
        : false

      const tokenPrice = tokenPrices[token.address] || 0
      const usdBalance = tokenPrice * parseFloat(currencyBalance?.toExact() || '0')

      return (
        <CurrencyRow
          isFavorite={isFavorite}
          showLoading={!!account}
          showImported={showImported}
          handleClickFavorite={handleClickFavorite}
          removeImportedToken={removeImportedToken}
          style={{ ...style, ...itemStyle }}
          currency={currency}
          currencyBalance={currencyBalance}
          isSelected={isSelected}
          showFavoriteIcon={showFavoriteIcon}
          onSelect={onCurrencySelect}
          otherSelected={otherSelected}
          setTokenToShowInfo={setTokenToShowInfo}
          usdBalance={usdBalance}
        />
      )
    },
    [
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      handleClickFavorite,
      showImported,
      removeImportedToken,
      itemStyle,
      showFavoriteIcon,
      tokenImports,
      tokenPrices,
      account,
      favoriteTokens,
      setTokenToShowInfo,
    ],
  )

  const loadMoreItems = useCallback(() => loadMoreRows?.(), [loadMoreRows])
  const itemCount = hasMore ? currencies.length + 1 : currencies.length // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const isItemLoaded = (index: number) => !hasMore || index < currencies.length

  return (
    <div className="flex-1">
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreItems} threshold={3}>
            {({ onItemsRendered, ref }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemCount={itemCount}
                itemSize={14 * 4 + 8}
                onItemsRendered={onItemsRendered}
                ref={ref}
                outerRef={listTokenRef}
              >
                {({ index, style }: { index: number; style: CSSProperties }) => {
                  if (!isItemLoaded(index)) {
                    return (
                      <div className="px-2 pt-2" style={style}>
                        <div className="flex h-14 items-center justify-center">
                          <Loader size="20px" />
                        </div>
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
                        style={{ height: 14 * 4 }}
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

export default memo(CurrencyList)
