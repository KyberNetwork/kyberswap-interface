import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import React, { CSSProperties, ReactNode, memo, useCallback } from 'react'
import { Info, Star, Trash } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { formattedNum } from 'utils'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { isTokenNative } from 'utils/tokenInfo'

import ImportRow from './ImportRow'

function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  return (
    <span className="text-base max-md:text-sm" title={balance.toExact()}>
      {balance.toSignificant(10)}
    </span>
  )
}

export const getDisplayTokenInfo = (currency: Currency) => {
  return {
    symbol: isTokenNative(currency) ? currency.symbol : currency?.wrapped?.symbol || currency.symbol,
  }
}
export function CurrencyRow({
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
}: {
  showImported?: boolean
  showFavoriteIcon?: boolean
  currency: Currency
  currencyBalance: CurrencyAmount<Currency>
  onSelect?: (currency: Currency) => void
  isSelected: boolean
  otherSelected?: boolean
  style?: CSSProperties
  handleClickFavorite?: (e: React.MouseEvent, currency: Currency) => void
  removeImportedToken?: (token: Token) => void
  customName?: ReactNode
  customBalance?: ReactNode
  usdBalance?: number
  hoverColor?: string
  hideBalance?: boolean
  showLoading?: boolean
  isFavorite?: boolean
  setTokenToShowInfo?: (t: Token) => void
}) {
  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)

  const onClickRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeImportedToken?.(currency as Token)
  }

  const balanceComponent = hideBalance ? (
    '******'
  ) : currencyBalance ? (
    <Balance balance={currencyBalance} />
  ) : showLoading ? (
    <Loader />
  ) : null
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
        'flex h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-5 py-1',
        'data-[selected=true]:bg-bg6/15',
        !hoverColor && '[@media(hover:hover)]:hover:bg-buttonBlack',
      )}
    >
      <div className="flex items-center" style={{ gap: 8 }}>
        <CurrencyLogo currency={currency} size={'24px'} />
        <div className="flex flex-col gap-0.5">
          <span title={currency.name} className="font-medium" data-testid="token-symbol">
            {customName || symbol}
          </span>
          <div className="ml-0 text-xs font-light text-subText">
            {showImported ? balanceComponent : nativeCurrency?.name}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <div className="flex flex-shrink-0 items-center justify-self-end" style={{ gap: 15 }}>
          {showImported ? (
            <Trash
              onClick={onClickRemove}
              data-testid="button-remove-import-token"
              className="h-5 w-4 fill-current text-subText hover:text-text"
            />
          ) : customBalance !== undefined ? (
            customBalance
          ) : (
            balanceComponent
          )}
          {showFavoriteIcon && (
            <Star
              onClick={e => handleClickFavorite?.(e, currency)}
              data-active={isFavorite}
              data-testid="button-favorite-token"
              role="button"
              className="size-5 text-subText hover:text-primary data-[active=true]:fill-current data-[active=true]:text-primary"
            />
          )}
          {setTokenToShowInfo && (
            <Info
              role="button"
              onClick={e => {
                e.stopPropagation()
                setTokenToShowInfo(currency.wrapped)
              }}
              size={18}
              className="text-subText hover:text-text"
            />
          )}
        </div>
        {usdBalance !== undefined && !hideBalance && (
          <span className="text-xs text-subText">{formattedNum(usdBalance + '', true)}</span>
        )}
      </div>
    </div>
  )
}

interface TokenRowProps {
  currency: Currency | undefined
  currencyBalance: CurrencyAmount<Currency>
  index: number
  style: CSSProperties
}

function CurrencyList({
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
}: {
  showFavoriteIcon?: boolean
  showImported?: boolean
  hasMore?: boolean
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  otherCurrency?: Currency | null
  setImportToken?: (token: Token) => void
  handleClickFavorite?: (e: React.MouseEvent, currency: Currency) => void
  removeImportedToken?: (token: Token) => void
  loadMoreRows?: () => Promise<void>
  listTokenRef?: React.Ref<HTMLDivElement>
  itemStyle?: CSSProperties
  customChainId?: ChainId
  setTokenToShowInfo?: (t: Token) => void
}) {
  const currencyBalances = useCurrencyBalances(currencies, customChainId)
  const { account } = useActiveWeb3React()
  const tokenImports = useUserAddedTokens(customChainId)
  const { favoriteTokens } = useUserFavoriteTokens(customChainId)

  const Row = useCallback(
    function TokenRow({ style, currency, currencyBalance }: TokenRowProps) {
      const isSelected = Boolean(currency && selectedCurrency?.equals(currency))
      const otherSelected = Boolean(currency && otherCurrency?.equals(currency))

      const token = currency?.wrapped
      const extendCurrency = currency as WrappedTokenInfo

      const showImport =
        token &&
        !extendCurrency?.isWhitelisted &&
        !tokenImports.find(importedToken => importedToken.address === token.address) &&
        !isTokenNative(currency)
      if (showImport && token && setImportToken) {
        return <ImportRow style={style} token={token} setImportToken={setImportToken} dim={true} />
      }

      if (currency) {
        // whitelist

        const isFavorite = (() => {
          if (currency.isToken && favoriteTokens) {
            const addr = (currency as Token).address ?? ''
            return !!favoriteTokens?.includes(addr) || !!favoriteTokens?.includes(addr.toLowerCase())
          }
          return false
        })()

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
          />
        )
      }

      return null
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
      account,
      favoriteTokens,
      setTokenToShowInfo,
    ],
  )
  const loadMoreItems = useCallback(() => loadMoreRows?.(), [loadMoreRows])
  const itemCount = hasMore ? currencies.length + 1 : currencies.length // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const isItemLoaded = (index: number) => !hasMore || index < currencies.length
  return (
    <div style={{ flex: 1 }}>
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreItems} threshold={3}>
            {({ onItemsRendered, ref }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemCount={itemCount}
                itemSize={56}
                onItemsRendered={onItemsRendered}
                ref={ref}
                outerRef={listTokenRef}
              >
                {({ index, style }: { index: number; style: CSSProperties }) => {
                  if (!isItemLoaded(index)) {
                    return (
                      <div className="mb-2.5 flex justify-center text-[13px]" style={style}>
                        <span>loading...</span>
                      </div>
                    )
                  }
                  return (
                    <Row
                      index={index}
                      currency={currencies[index]}
                      key={currencies[index]?.wrapped.address || index}
                      currencyBalance={currencyBalances[index]}
                      style={style}
                    />
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
