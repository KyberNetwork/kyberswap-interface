import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMedia } from 'react-use'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useGetOrdersByTokenPairQuery } from 'services/limitOrder'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as NoDataIcon } from 'assets/svg/no-data.svg'
import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import RefreshLoading from '../ListLimitOrder/RefreshLoading'
import { NoResultWrapper } from '../ListOrder'
import { groupToMap } from '../helpers'
import { LimitOrderFromTokenPair, LimitOrderFromTokenPairFormatted } from '../type'
import OrderItem, { ChainImage } from './OrderItem'
import TableHeader from './TableHeader'

const ITEMS_DISPLAY = 10
const ITEM_HEIGHT = 44
const DESKTOP_SIGNIFICANT_DIGITS = 6
const MOBILE_SIGNIFICANT_DIGITS = 5
const MOBILE_SIGNIFICANT_DIGITS_FOR_LESS_THAN_ONE = 4

const OrderBookWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  position: relative;
`

const RefreshText = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  right: 16px;
  top: -2.5rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    position: static;
    margin-bottom: 1rem;
    margin-left: 1rem;
  `}
`

const MarketPrice = styled.div`
  padding: 8px 12px;
  font-size: 20px;
  line-height: 24px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 2fr 1fr;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1.2fr 1.8fr 2fr 1.8fr;
  `}
`

const OrderItemWrapper = styled(FixedSizeList)`
  ::-webkit-scrollbar {
    display: unset;
    width: 4px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
    border-radius: 999px;
  }
`

const NoDataPanel = () => (
  <NoResultWrapper>
    <NoDataIcon />
    <Text marginTop={10}>
      <Trans>No orders.</Trans>
    </Text>
  </NoResultWrapper>
)

const getSignificantDigits = (value: string, upToSmall: boolean) =>
  upToSmall
    ? parseFloat(value) < 1
      ? MOBILE_SIGNIFICANT_DIGITS_FOR_LESS_THAN_ONE
      : MOBILE_SIGNIFICANT_DIGITS
    : DESKTOP_SIGNIFICANT_DIGITS

const formatOrders = (
  orders: LimitOrderFromTokenPair[],
  makerCurrency: Currency | undefined,
  takerCurrency: Currency | undefined,
  upToSmall: boolean,
  reverse = false,
): LimitOrderFromTokenPairFormatted[] => {
  if (!makerCurrency || !takerCurrency) return []

  // Format orders, remove orders that are above 99% filled and sort descending by rate
  const ordersFormatted = orders
    .map(order => {
      const newMakerCurrency = new Token(
        makerCurrency.chainId,
        makerCurrency.wrapped.address,
        order.makerAssetDecimals,
        makerCurrency.symbol,
      )
      const newTakerCurrency = new Token(
        takerCurrency.chainId,
        takerCurrency.wrapped.address,
        order.takerAssetDecimals,
        takerCurrency.symbol,
      )

      const makerCurrencyAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.makingAmount)
      const takerCurrencyAmount = CurrencyAmount.fromRawAmount(newTakerCurrency, order.takingAmount)

      const rate = (
        !reverse
          ? takerCurrencyAmount.divide(makerCurrencyAmount).multiply(makerCurrencyAmount.decimalScale)
          : makerCurrencyAmount.divide(takerCurrencyAmount).multiply(takerCurrencyAmount.decimalScale)
      ).toSignificant(100)

      const filledMakingAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.filledMakingAmount)
      const filled = (parseFloat(filledMakingAmount.toExact()) / parseFloat(makerCurrencyAmount.toExact())) * 100

      return {
        id: order.id,
        chainId: order.chainId,
        rate,
        makerAmount: makerCurrencyAmount.toExact(),
        takerAmount: takerCurrencyAmount.toExact(),
        filled: filled > 99 ? '100' : filled.toFixed(),
      }
    })
    .filter(order => order.filled !== '100')
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
    .map(order => ({
      ...order,
      rate: formatDisplayNumber(order.rate, {
        significantDigits: getSignificantDigits(order.rate, upToSmall),
      }),
    }))

  // Merge orders with the same rate
  const mergedOrders: LimitOrderFromTokenPairFormatted[] = []
  const groupOrders = groupToMap(ordersFormatted, ({ rate }: LimitOrderFromTokenPairFormatted) => rate)

  groupOrders.forEach((group: LimitOrderFromTokenPairFormatted[]) => {
    const mergedOrder = group?.reduce(
      (accumulatorOrder: LimitOrderFromTokenPairFormatted | null, currentOrder: LimitOrderFromTokenPairFormatted) =>
        accumulatorOrder
          ? {
              ...currentOrder,
              makerAmount: (parseFloat(currentOrder.makerAmount) + parseFloat(accumulatorOrder.makerAmount)).toString(),
              takerAmount: (parseFloat(currentOrder.takerAmount) + parseFloat(accumulatorOrder.takerAmount)).toString(),
            }
          : currentOrder,
      null,
    )
    if (mergedOrder) {
      mergedOrder.makerAmount = formatDisplayNumber(mergedOrder.makerAmount, {
        significantDigits: getSignificantDigits(mergedOrder.makerAmount, upToSmall),
      })
      mergedOrder.takerAmount = formatDisplayNumber(mergedOrder.takerAmount, {
        significantDigits: getSignificantDigits(mergedOrder.takerAmount, upToSmall),
      })
      mergedOrders.push(mergedOrder)
    }
  })

  return mergedOrders
}

export default function OrderBook() {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { chainId, networkInfo } = useActiveWeb3React()
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()
  const {
    loading: loadingMarketRate,
    tradeInfo: { marketRate = 0 } = {},
    refetch: refetchMarketRate,
  } = useBaseTradeInfoLimitOrder(makerCurrency, takerCurrency, chainId)

  const ordersWrapperRef = useRef<FixedSizeList<any>>(null)

  const {
    data: { orders = [] } = {},
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
    isFetching: isFetchingOrders,
  } = useGetOrdersByTokenPairQuery({
    chainId,
    makerAsset: makerCurrency?.wrapped?.address,
    takerAsset: takerCurrency?.wrapped?.address,
  })
  const {
    data: { orders: reversedOrders = [] } = {},
    isLoading: isLoadingReversedOrder,
    refetch: refetchReversedOrder,
    isFetching: isFetchingReversedOrder,
  } = useGetOrdersByTokenPairQuery({
    chainId,
    makerAsset: takerCurrency?.wrapped?.address,
    takerAsset: makerCurrency?.wrapped?.address,
  })

  const loadingOrders = useShowLoadingAtLeastTime(isLoadingOrders)
  const loadingReversedOrders = useShowLoadingAtLeastTime(isLoadingReversedOrder)

  const formattedOrders = useMemo(
    () => formatOrders(orders, makerCurrency, takerCurrency, upToSmall),
    [orders, makerCurrency, takerCurrency, upToSmall],
  )
  const formattedReversedOrders = useMemo(
    () => formatOrders(reversedOrders, takerCurrency, makerCurrency, upToSmall, true),
    [reversedOrders, takerCurrency, makerCurrency, upToSmall],
  )

  const refetchActive = useMemo(() => !!makerCurrency && !!takerCurrency, [makerCurrency, takerCurrency])

  const refetchLoading = useMemo(
    () => loadingMarketRate || isFetchingOrders || isFetchingReversedOrder,
    [loadingMarketRate, isFetchingOrders, isFetchingReversedOrder],
  )

  const onRefreshOrders = useCallback(() => {
    refetchMarketRate()
    refetchOrders()
    refetchReversedOrder()
  }, [refetchMarketRate, refetchOrders, refetchReversedOrder])

  // Scroll to bottom when new orders are fetched
  useEffect(() => {
    if (formattedOrders.length && ordersWrapperRef.current) {
      ordersWrapperRef.current.scrollToItem(formattedOrders.length - 1)
    }
  }, [formattedOrders, loadingOrders, loadingReversedOrders])

  return (
    <OrderBookWrapper>
      {loadingOrders || loadingReversedOrders ? (
        <LocalLoader />
      ) : (
        <>
          {refetchActive && (
            <RefreshText>
              <Text fontSize={'14px'} color={theme.subText} marginRight={'4px'}>
                <Trans>Orders refresh in</Trans>
              </Text>{' '}
              <RefreshLoading refetchLoading={refetchLoading} onRefresh={onRefreshOrders} />
            </RefreshText>
          )}

          <TableHeader />

          {formattedOrders.length > 0 ? (
            <OrderItemWrapper
              ref={ordersWrapperRef}
              height={(formattedOrders.length < ITEMS_DISPLAY ? formattedOrders.length : ITEMS_DISPLAY) * ITEM_HEIGHT}
              itemCount={formattedOrders.length}
              itemSize={ITEM_HEIGHT}
              width={'100%'}
            >
              {({ index, style }: { index: number; style: CSSProperties }) => {
                const order = formattedOrders[index]
                return <OrderItem key={order.id} style={style} order={order} />
              }}
            </OrderItemWrapper>
          ) : (
            <NoDataPanel />
          )}

          {!!marketRate && (
            <MarketPrice>
              <ChainImage src={networkInfo?.icon} alt="Network" />
              {formatDisplayNumber(marketRate, {
                significantDigits: getSignificantDigits(marketRate.toString(), upToSmall),
              })}
            </MarketPrice>
          )}

          {formattedReversedOrders.length > 0 ? (
            <OrderItemWrapper
              height={
                (formattedReversedOrders.length < ITEMS_DISPLAY ? formattedReversedOrders.length : ITEMS_DISPLAY) *
                ITEM_HEIGHT
              }
              itemCount={formattedReversedOrders.length}
              itemSize={ITEM_HEIGHT}
              width={'100%'}
            >
              {({ index, style }: { index: number; style: CSSProperties }) => {
                const order = formattedReversedOrders[index]
                return <OrderItem key={order.id} style={style} reverse order={order} />
              }}
            </OrderItemWrapper>
          ) : (
            <NoDataPanel />
          )}
        </>
      )}
    </OrderBookWrapper>
  )
}
