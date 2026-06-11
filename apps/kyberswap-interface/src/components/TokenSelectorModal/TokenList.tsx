import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { CSSProperties, ReactNode, memo, useCallback, useMemo } from 'react'
import { Info, Star, Trash } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { AutoRow } from 'components/Row'
import Skeleton from 'components/Skeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { getDisplayTokenInfo } from 'components/TokenSelectorModal/PinnedTokens'
import { useActiveWeb3React } from 'hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatDisplayNumber } from 'utils/numbers'
import { isTokenNative } from 'utils/tokenInfo'

const Balance = ({ balance }: { balance: CurrencyAmount<Currency> }) => {
  return (
    <span className="text-base max-md:text-sm" title={balance.toExact()}>
      {balance.toSignificant(10)}
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
}: TokenRowProps) => {
  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)
  const balanceSkeletonWidth = useMemo(() => Math.floor(Math.random() * 40) + 40, [])

  const onClickRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemoveImportedToken?.(currency as Token)
  }

  const renderBalance = () => {
    if (hideBalance) return <span className="text-base max-md:text-sm">******</span>
    if (currencyBalance) return <Balance balance={currencyBalance} />
    if (showLoading)
      return <Skeleton width={balanceSkeletonWidth} height={18} className="my-[3px]" variant="darkSubtle" />
    return null
  }
  const { symbol } = getDisplayTokenInfo(currency)

  return (
    <HStack
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
      <HStack className="min-w-0 flex-1 items-center gap-3">
        {showFavoriteIcon && (
          <Star
            onClick={e => onToggleFavorite?.(e, currency)}
            data-active={isFavorite}
            data-testid="button-favorite-token"
            role="button"
            className="size-4 text-subText hover:text-primary data-[active=true]:fill-current data-[active=true]:text-primary"
          />
        )}

        <CurrencyLogo currency={currency} size="24px" />
        <Stack className="min-w-0 gap-0.5">
          <span title={currency.name} className="font-medium" data-testid="token-symbol">
            {customName || symbol}
          </span>
          <span className="max-w-full truncate text-xs font-light text-subText">{nativeCurrency?.name}</span>
        </Stack>
      </HStack>

      <HStack className="shrink-0 items-center gap-3 justify-self-end">
        <Stack className="items-end gap-0.5">
          {customBalance !== undefined ? customBalance : renderBalance()}
          {usdBalance !== undefined && !hideBalance && (
            <span className="text-xs text-subText">
              {formatDisplayNumber(usdBalance, { style: 'currency', significantDigits: 4 })}
            </span>
          )}
        </Stack>
        {onRemoveImportedToken && (
          <Trash
            onClick={onClickRemove}
            data-testid="button-remove-import-token"
            className="size-4 text-subText hover:text-text"
          />
        )}
        {onShowTokenInfo && (
          <Info
            role="button"
            onClick={e => {
              e.stopPropagation()
              onShowTokenInfo(currency.wrapped)
            }}
            size={16}
            className="text-subText hover:text-text"
          />
        )}
      </HStack>
    </HStack>
  )
}

type ImportTokenRowProps = {
  token: Token
  style?: CSSProperties
  dim?: boolean
  onImportToken?: (token: Token) => void
}

const ImportTokenRow = ({ token, style, dim, onImportToken }: ImportTokenRowProps) => {
  return (
    <div
      style={style}
      className={cn(
        'grid h-14 items-center gap-2 rounded-lg px-5 py-1 hover:bg-primary-15 active:bg-primary-20',
        '[grid-template-columns:auto_minmax(auto,1fr)_auto]',
      )}
    >
      <CurrencyLogo currency={token} size="24px" style={dim ? { opacity: 0.5 } : undefined} />
      <AutoColumn className={cn('gap-1', dim && 'opacity-50')}>
        <AutoRow>
          <span className="text-base font-medium leading-[normal] text-text">{token.symbol}</span>
          <span className="ml-2 text-subText">
            <span className="block max-w-[140px] truncate text-xs" title={token.name}>
              {token.name}
            </span>
          </span>
        </AutoRow>
      </AutoColumn>
      <ButtonPrimary
        data-testid="button-import-token"
        width="fit-content"
        padding="6px 12px"
        fontWeight={500}
        fontSize="14px"
        className={cn(dim && 'opacity-50')}
        onClick={() => onImportToken?.(token)}
      >
        <Trans>Import</Trans>
      </ButtonPrimary>
    </div>
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

      const showImport =
        !isWhitelisted &&
        !tokenImports.find(importedToken => importedToken.address === token.address) &&
        !isTokenNative(currency)

      if (showImport && token && onImportToken) {
        return <ImportTokenRow style={style} token={token} onImportToken={onImportToken} dim={true} />
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

export default memo(TokenList)
