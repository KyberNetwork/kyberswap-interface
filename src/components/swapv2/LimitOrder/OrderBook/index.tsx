import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1.2fr 1.8fr 2fr 1fr;
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

const formatOrders = (
  orders: LimitOrderFromTokenPair[],
  reverse: boolean,
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  significantDigits: number,
): LimitOrderFromTokenPairFormatted[] => {
  if (!currencyIn || !currencyOut) return []

  // Format orders, remove orders that are above 99% filled and sort descending by rate
  const ordersFormatted = orders
    .map(order => {
      const currencyInAmount = CurrencyAmount.fromRawAmount(!reverse ? currencyIn : currencyOut, order.makingAmount)
      const currencyOutAmount = CurrencyAmount.fromRawAmount(!reverse ? currencyOut : currencyIn, order.takingAmount)
      const rate = !reverse
        ? parseFloat(currencyOutAmount.toExact()) / parseFloat(currencyInAmount.toExact())
        : parseFloat(currencyInAmount.toExact()) / parseFloat(currencyOutAmount.toExact())

      const firstAmount = (!reverse ? currencyInAmount : currencyOutAmount).toExact()
      const secondAmount = (!reverse ? currencyOutAmount : currencyInAmount).toExact()

      const filledMakingAmount = CurrencyAmount.fromRawAmount(
        !reverse ? currencyIn : currencyOut,
        order.filledMakingAmount,
      )
      const filled = (parseFloat(filledMakingAmount.toExact()) / parseFloat(currencyInAmount.toExact())) * 100

      return {
        id: order.id,
        chainId: order.chainId,
        rate,
        firstAmount,
        secondAmount,
        filled: filled > 99 ? '100' : filled.toFixed(),
      }
    })
    .filter(order => order.filled !== '100')
    .sort((a, b) => b.rate - a.rate)
    .map(order => ({
      ...order,
      rate: formatDisplayNumber(order.rate, { significantDigits }),
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
              firstAmount: (parseFloat(currentOrder.firstAmount) + parseFloat(accumulatorOrder.firstAmount)).toString(),
              secondAmount: (
                parseFloat(currentOrder.secondAmount) + parseFloat(accumulatorOrder.secondAmount)
              ).toString(),
            }
          : currentOrder,
      null,
    )
    if (mergedOrder) {
      mergedOrder.firstAmount = formatDisplayNumber(mergedOrder.firstAmount, { significantDigits })
      mergedOrder.secondAmount = formatDisplayNumber(mergedOrder.secondAmount, { significantDigits })
      mergedOrders.push(mergedOrder)
    }
  })

  return mergedOrders
}

export default function OrderBook() {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { chainId, networkInfo } = useActiveWeb3React()
  const { currencyIn, currencyOut } = useLimitState()
  const {
    loading: loadingMarketRate,
    tradeInfo: { marketRate = 0 } = {},
    refetch: refetchMarketRate,
  } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)

  const [showAmountOut, setShowAmountOut] = useState<boolean>(true)

  const ordersWrapperRef = useRef<FixedSizeList<any>>(null)

  const {
    data: { orders = [] } = {},
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
    isFetching: isFetchingOrders,
  } = useGetOrdersByTokenPairQuery({
    chainId,
    makerAsset: currencyIn?.wrapped?.address,
    takerAsset: currencyOut?.wrapped?.address,
  })
  const {
    data: { orders: reversedOrders = [] } = {},
    isLoading: isLoadingReversedOrder,
    refetch: refetchReversedOrder,
    isFetching: isFetchingReversedOrder,
  } = useGetOrdersByTokenPairQuery({
    chainId,
    makerAsset: currencyOut?.wrapped?.address,
    takerAsset: currencyIn?.wrapped?.address,
  })

  const loadingOrders = useShowLoadingAtLeastTime(isLoadingOrders)
  const loadingReversedOrders = useShowLoadingAtLeastTime(isLoadingReversedOrder)

  const formattedOrders = useMemo(
    () =>
      formatOrders(
        orders,
        false,
        currencyIn,
        currencyOut,
        upToSmall ? MOBILE_SIGNIFICANT_DIGITS : DESKTOP_SIGNIFICANT_DIGITS,
      ),
    [orders, currencyIn, currencyOut, upToSmall],
  )
  const formattedReversedOrders = useMemo(
    () =>
      formatOrders(
        reversedOrders,
        true,
        currencyIn,
        currencyOut,
        upToSmall ? MOBILE_SIGNIFICANT_DIGITS : DESKTOP_SIGNIFICANT_DIGITS,
      ),
    [reversedOrders, currencyIn, currencyOut, upToSmall],
  )

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
          <RefreshText>
            <Text fontSize={'14px'} color={theme.subText} marginRight={'4px'}>
              <Trans>Orders refresh in</Trans>
            </Text>{' '}
            <RefreshLoading refetchLoading={refetchLoading} onRefresh={onRefreshOrders} />
          </RefreshText>

          <TableHeader showAmountOut={showAmountOut} setShowAmountOut={setShowAmountOut} />

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
                return <OrderItem key={order.id} style={style} order={order} showAmountOut={showAmountOut} />
              }}
            </OrderItemWrapper>
          ) : (
            <NoDataPanel />
          )}

          {!!marketRate && (
            <MarketPrice>
              <ChainImage src={networkInfo?.icon} alt="Network" />
              {formatDisplayNumber(marketRate, {
                significantDigits: upToSmall ? MOBILE_SIGNIFICANT_DIGITS : DESKTOP_SIGNIFICANT_DIGITS,
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
                return <OrderItem key={order.id} style={style} reverse order={order} showAmountOut={showAmountOut} />
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
