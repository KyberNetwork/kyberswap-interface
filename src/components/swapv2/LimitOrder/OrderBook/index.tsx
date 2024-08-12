import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useGetOrdersByTokenPairQuery } from 'services/limitOrder'
import styled from 'styled-components'

import { ReactComponent as NoDataIcon } from 'assets/svg/no-data.svg'
import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { NoResultWrapper } from '../ListOrder'
import { LimitOrderFromTokenPair, LimitOrderFromTokenPairFormatted } from '../type'
import OrderItem from './OrderItem'
import TableHeader from './TableHeader'

const NOT_APPLICABLE = 'N/A'
const ITEMS_DISPLAY = 10
const ITEM_HEIGHT = 44
const DESKTOP_SIGNIFICANT_DIGITS = 6
const MOBILE_SIGNIFICANT_DIGITS = 5
export const INTERVAL_REFETCH_TIME = 10 // seconds

const OrderBookWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
`

const MarketPrice = styled.div`
  padding: 8px 12px;
  font-size: 20px;
  line-height: 24px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
`

const OrderItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-height: ${ITEMS_DISPLAY * ITEM_HEIGHT}px;
  overflow-y: auto;

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

  // Format orders and remove orders that are above 99% filled
  const ordersFormatted = orders
    .map(order => {
      const currencyInAmount = CurrencyAmount.fromRawAmount(!reverse ? currencyIn : currencyOut, order.makingAmount)
      const currencyOutAmount = CurrencyAmount.fromRawAmount(!reverse ? currencyOut : currencyIn, order.takingAmount)
      const rate = formatDisplayNumber(
        !reverse
          ? parseFloat(currencyOutAmount.toExact()) / parseFloat(currencyInAmount.toExact())
          : parseFloat(currencyInAmount.toExact()) / parseFloat(currencyOutAmount.toExact()),
        { significantDigits },
      )

      const firstAmount = (!reverse ? currencyInAmount : currencyOutAmount).toExact()
      const secondAmount = (!reverse ? currencyOutAmount : currencyInAmount).toExact()

      const filledMakingAmount = CurrencyAmount.fromRawAmount(
        !reverse ? currencyIn : currencyOut,
        order.filledMakingAmount,
      )
      const filled = (parseFloat(filledMakingAmount.toExact()) / parseFloat(currencyInAmount.toExact())) * 100

      return {
        id: order.id,
        rate,
        firstAmount,
        secondAmount,
        filled: filled > 99 ? '100' : filled.toFixed(),
      }
    })
    .filter(order => order.filled !== '100')

  // Merge orders with the same rate
  const mergedOrders: LimitOrderFromTokenPairFormatted[] = []
  const groupOrders = Object.groupBy(ordersFormatted, ({ rate }: LimitOrderFromTokenPairFormatted) => rate)

  Object.keys(groupOrders).map((key: string) => {
    const mergedOrder = groupOrders[key]?.reduce(
      (accumulatorOrder: LimitOrderFromTokenPairFormatted | null, order: LimitOrderFromTokenPairFormatted) =>
        accumulatorOrder
          ? {
              ...order,
              firstAmount: (parseFloat(order.firstAmount) + parseFloat(accumulatorOrder.firstAmount)).toString(),
              secondAmount: (parseFloat(order.secondAmount) + parseFloat(accumulatorOrder.secondAmount)).toString(),
            }
          : order,
      null,
    )
    if (mergedOrder) {
      mergedOrder.firstAmount = formatDisplayNumber(mergedOrder.firstAmount, { significantDigits })
      mergedOrder.secondAmount = formatDisplayNumber(mergedOrder.secondAmount, { significantDigits })
      mergedOrders.push(mergedOrder)
    }
  })

  return reverse ? mergedOrders : mergedOrders.reverse()
}

let intervalRefetch: NodeJS.Timeout

export default function OrderBook({
  intervalTime,
  setIntervalTime,
}: {
  intervalTime: number
  setIntervalTime: React.Dispatch<React.SetStateAction<number>>
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { chainId } = useActiveWeb3React()
  const { currencyIn, currencyOut } = useLimitState()
  const {
    loading: loadingMarketRate,
    tradeInfo: { marketRate = '' } = {},
    refetch: refetchMarketRate,
  } = useBaseTradeInfoLimitOrder(currencyIn, currencyOut, chainId)

  const ordersWrapperRef = useRef<HTMLDivElement>(null)

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

  // Scroll to bottom when new orders are fetched
  useEffect(() => {
    if (orders.length && ordersWrapperRef.current) {
      ordersWrapperRef.current.scrollTop = ordersWrapperRef.current.scrollHeight
    }
  }, [orders, loadingOrders, loadingReversedOrders])

  useEffect(() => {
    setIntervalTime(INTERVAL_REFETCH_TIME)
  }, [setIntervalTime])

  useEffect(() => {
    intervalRefetch = setInterval(() => {
      setIntervalTime((prev: number) => (prev === 0 ? 0 : prev - 1))
    }, 1000)

    return () => {
      clearInterval(intervalRefetch)
    }
  }, [setIntervalTime])

  useEffect(() => {
    if (!intervalTime) {
      refetchMarketRate()
      refetchOrders()
      refetchReversedOrder()
    }
  }, [intervalTime, refetchMarketRate, refetchOrders, refetchReversedOrder])

  useEffect(() => {
    if (!loadingMarketRate && !isFetchingOrders && !isFetchingReversedOrder) setIntervalTime(INTERVAL_REFETCH_TIME)
  }, [loadingMarketRate, isFetchingOrders, isFetchingReversedOrder, setIntervalTime])

  return (
    <OrderBookWrapper>
      {loadingOrders || loadingReversedOrders ? (
        <LocalLoader />
      ) : (
        <>
          <TableHeader />

          {formattedOrders.length > 0 ? (
            <OrderItemWrapper ref={ordersWrapperRef}>
              {formattedOrders.map(order => (
                <OrderItem key={order.id} order={order} />
              ))}
            </OrderItemWrapper>
          ) : (
            <NoDataPanel />
          )}

          <MarketPrice>
            {marketRate
              ? formatDisplayNumber(marketRate, {
                  significantDigits: upToSmall ? MOBILE_SIGNIFICANT_DIGITS : DESKTOP_SIGNIFICANT_DIGITS,
                })
              : NOT_APPLICABLE}
          </MarketPrice>

          {reversedOrders.length > 0 ? (
            <OrderItemWrapper>
              {formattedReversedOrders.map(order => (
                <OrderItem key={order.id} reverse order={order} />
              ))}
            </OrderItemWrapper>
          ) : (
            <NoDataPanel />
          )}
        </>
      )}
    </OrderBookWrapper>
  )
}
