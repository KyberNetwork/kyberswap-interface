import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { CSSProperties, useCallback, useEffect, useMemo, useRef } from 'react'
import { useMedia } from 'react-use'
import { FixedSizeList } from 'react-window'
import { useGetOrdersByTokenPairQuery } from 'services/limitOrder'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import LocalLoader from 'components/LocalLoader'
import RefreshLoading from 'components/RefreshLoading'
import { NoResultWrapper } from 'components/swapv2/LimitOrder/ListOrder'
import OrderItem, { ChainImage } from 'components/swapv2/LimitOrder/OrderBook/OrderItem'
import TableHeader from 'components/swapv2/LimitOrder/OrderBook/TableHeader'
import { groupToMap } from 'components/swapv2/LimitOrder/helpers'
import { LimitOrderFromTokenPair, LimitOrderFromTokenPairFormatted } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const ITEMS_DISPLAY = 10
const ITEM_HEIGHT = 44
const DESKTOP_SIGNIFICANT_DIGITS = 6
const MOBILE_SIGNIFICANT_DIGITS = 5
const MOBILE_SIGNIFICANT_DIGITS_FOR_LESS_THAN_ONE = 4

const ORDER_LIST_SCROLLBAR_CLASS =
  '[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-disableText [&::-webkit-scrollbar-thumb]:rounded-full'

const NoDataPanel = () => (
  <NoResultWrapper>
    <NoDataIcon />
    <span className="mt-2.5">
      <Trans>No orders.</Trans>
    </span>
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

  useEffect(() => {
    if (formattedOrders.length && ordersWrapperRef.current) {
      ordersWrapperRef.current.scrollToItem(formattedOrders.length - 1)
    }
  }, [formattedOrders, loadingOrders, loadingReversedOrders])

  return (
    <div className="relative mt-4 flex flex-col">
      {loadingOrders || loadingReversedOrders ? (
        <LocalLoader />
      ) : (
        <>
          {refetchActive && (
            <div className="absolute -top-10 right-4 flex items-center max-sm:static max-sm:mb-4 max-sm:ml-4">
              <span className="mr-1 text-sm text-subText">
                <Trans>Orders refresh in</Trans>
              </span>{' '}
              <RefreshLoading refetchLoading={refetchLoading} onRefresh={onRefreshOrders} />
            </div>
          )}

          <TableHeader />

          {formattedOrders.length > 0 ? (
            <FixedSizeList
              ref={ordersWrapperRef}
              className={ORDER_LIST_SCROLLBAR_CLASS}
              height={(formattedOrders.length < ITEMS_DISPLAY ? formattedOrders.length : ITEMS_DISPLAY) * ITEM_HEIGHT}
              itemCount={formattedOrders.length}
              itemSize={ITEM_HEIGHT}
              width={'100%'}
            >
              {({ index, style }: { index: number; style: CSSProperties }) => {
                const order = formattedOrders[index]
                return <OrderItem key={order.id} style={style} order={order} />
              }}
            </FixedSizeList>
          ) : (
            <NoDataPanel />
          )}

          {!!marketRate && (
            <div className="grid grid-cols-[1fr_2fr_2fr_2fr_1fr] bg-white-04 px-3 py-2 text-xl leading-6 max-[500px]:grid-cols-[1.2fr_1.8fr_2fr_1.8fr]">
              <ChainImage src={networkInfo?.icon} alt="Network" />
              {formatDisplayNumber(marketRate, {
                significantDigits: getSignificantDigits(marketRate.toString(), upToSmall),
              })}
            </div>
          )}

          {formattedReversedOrders.length > 0 ? (
            <FixedSizeList
              className={ORDER_LIST_SCROLLBAR_CLASS}
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
            </FixedSizeList>
          ) : (
            <NoDataPanel />
          )}
        </>
      )}
    </div>
  )
}
