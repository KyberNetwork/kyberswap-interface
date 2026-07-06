import { Trans } from '@lingui/macro'
import { skipToken } from '@reduxjs/toolkit/query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { useGetOrdersByTokenPairQuery } from 'services/limitOrder'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import OrderRow from 'components/LimitOrder/OrderBook/OrderRow'
import TableHeader, { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import { formatOrders, getSchemaToken, invertRateValue } from 'components/LimitOrder/OrderBook/utils'
import TakeOrderConfirmModal from 'components/LimitOrder/TakeOrder/TakeOrderConfirmModal'
import { useLimitOrderTracking } from 'components/LimitOrder/hooks/useLimitOrderTracking'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { formatPriceInputValue } from 'components/LimitOrder/utils'
import RefetchIndicator from 'components/RefetchIndicator'
import RefreshLoading from 'components/RefreshLoading'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import { useStableCoins } from 'hooks/useTokens'
import { getDefaultRevertPrice as getDefaultInvertPrice } from 'pages/Earns/utils'
import { useLimitState } from 'state/limit/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const refetchSafely = (refetch: () => { catch?: (onRejected: () => void) => unknown } | void) => {
  try {
    refetch()?.catch?.(() => {})
  } catch {}
}

const NoDataPanel = () => (
  <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-sm font-medium text-subText">
    <NoDataIcon />
    <Trans>No orders</Trans>
  </div>
)

const SectionLabel = ({ color, label, symbol }: { color: string; label: React.ReactNode; symbol?: string }) => (
  <div className="border-b border-border/20 px-4 py-3 text-sm font-medium tracking-[0.08em]" style={{ color }}>
    {label} <span className="text-text">{symbol}</span>
  </div>
)

const OrderSide = ({ children, reverse }: { children: React.ReactNode; reverse?: boolean }) => {
  return <div className={cn('max-h-[336px] overflow-y-auto', reverse && 'flex flex-col-reverse')}>{children}</div>
}

const OrderBook = () => {
  const { chainId, networkInfo } = useActiveWeb3React()
  const { setPriceInputRequest } = useLimitOrderContext()
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()
  const { isStableCoin } = useStableCoins(chainId)
  const limitOrderTracking = useLimitOrderTracking()

  const [selectedOrderToTake, setSelectedOrderToTake] = useState<LimitOrderFromTokenPairFormatted>()
  const [isTakeOrderModalOpen, setIsTakeOrderModalOpen] = useState(false)
  const [invertedRateOverride, setInvertedRateOverride] = useState<{ pairKey: string; value: boolean }>()

  const {
    loading: loadingMarketRate,
    tradeInfo: { marketRate = 0, invertRate = 0, priceUsdIn = 0, priceUsdOut = 0 } = {},
    refetch: refetchMarketRate,
  } = useBaseTradeInfoLimitOrder(makerCurrency, takerCurrency, chainId)

  const makerAsset = makerCurrency?.wrapped.address
  const takerAsset = takerCurrency?.wrapped.address

  const {
    data: { orders = [] } = {},
    isFetching: isFetchingOrders,
    isSuccess: isOrdersLoaded,
    refetch: refetchOrders,
  } = useGetOrdersByTokenPairQuery(makerAsset && takerAsset ? { chainId, makerAsset, takerAsset } : skipToken)

  const {
    data: { orders: reversedOrders = [] } = {},
    isFetching: isFetchingReversedOrder,
    isSuccess: isReversedOrdersLoaded,
    refetch: refetchReversedOrders,
  } = useGetOrdersByTokenPairQuery(
    makerAsset && takerAsset ? { chainId, makerAsset: takerAsset, takerAsset: makerAsset } : skipToken,
  )

  const refetchLoading = loadingMarketRate || isFetchingOrders || isFetchingReversedOrder

  const formattedOrders = useMemo(
    () => formatOrders(orders, makerCurrency, takerCurrency, marketRate, priceUsdIn),
    [orders, makerCurrency, takerCurrency, marketRate, priceUsdIn],
  )
  const formattedReversedOrders = useMemo(
    () => formatOrders(reversedOrders, takerCurrency, makerCurrency, marketRate, priceUsdOut, true),
    [reversedOrders, takerCurrency, makerCurrency, marketRate, priceUsdOut],
  )

  const visibleSellOrders = formattedOrders.slice(-10).reverse()
  const visibleBuyOrders = formattedReversedOrders.slice(0, 10)

  const ratePairKey = useMemo(() => {
    const makerAddress = makerCurrency?.wrapped.address.toLowerCase()
    const takerAddress = takerCurrency?.wrapped.address.toLowerCase()

    return makerAddress && takerAddress ? `${chainId}:${makerAddress}:${takerAddress}` : ''
  }, [chainId, makerCurrency, takerCurrency])

  const defaultShowInvertedRate = useMemo(() => {
    const makerToken = getSchemaToken(makerCurrency, isStableCoin(makerCurrency?.wrapped.address))
    const takerToken = getSchemaToken(takerCurrency, isStableCoin(takerCurrency?.wrapped.address))
    if (!makerToken || !takerToken) return false

    return getDefaultInvertPrice({ token0: makerToken, token1: takerToken }, chainId)
  }, [chainId, isStableCoin, makerCurrency, takerCurrency])

  const showInvertedRate =
    invertedRateOverride?.pairKey === ratePairKey ? invertedRateOverride.value : defaultShowInvertedRate

  const displayedMarketRate = showInvertedRate ? invertRateValue(marketRate) : marketRate

  const displayedRatePair = showInvertedRate
    ? `${takerCurrency?.wrapped.symbol}/${makerCurrency?.wrapped.symbol}`
    : `${makerCurrency?.wrapped.symbol}/${takerCurrency?.wrapped.symbol}`

  const onRefreshOrders = useCallback(() => {
    refetchSafely(refetchMarketRate)
    refetchSafely(refetchOrders)
    refetchSafely(refetchReversedOrders)
  }, [refetchMarketRate, refetchOrders, refetchReversedOrders])

  useEffect(() => {
    setInvertedRateOverride(undefined)
  }, [ratePairKey])

  const handleInvertRate = useCallback(() => {
    if (!ratePairKey) return
    const nextShowInvertedRate = !showInvertedRate

    limitOrderTracking.trackOrderBookClickPairInvert({
      makerCurrency,
      takerCurrency,
      direction: nextShowInvertedRate ? 'inverted' : 'native',
    })

    setInvertedRateOverride({
      pairKey: ratePairKey,
      value: nextShowInvertedRate,
    })
  }, [limitOrderTracking, makerCurrency, ratePairKey, showInvertedRate, takerCurrency])

  const handleSetMarketRate = useCallback(() => {
    if (!marketRate || !invertRate) return

    setPriceInputRequest({
      rate: formatPriceInputValue(marketRate),
      invertRate: formatPriceInputValue(invertRate),
    })
  }, [invertRate, marketRate, setPriceInputRequest])

  const handleTakeOrder = useCallback(
    (order: LimitOrderFromTokenPairFormatted) => {
      limitOrderTracking.trackOrderBookClickTake({
        order,
        makerCurrency,
        takerCurrency,
      })

      setSelectedOrderToTake(order)
      setIsTakeOrderModalOpen(true)
    },
    [limitOrderTracking, makerCurrency, takerCurrency],
  )

  const handleDismissTakeOrderModal = () => {
    setIsTakeOrderModalOpen(false)
    setSelectedOrderToTake(undefined)
  }

  return (
    <div className="relative flex flex-col">
      <TableHeader />
      <div className="relative h-0">
        <RefetchIndicator visible={refetchLoading} />
      </div>
      <SectionLabel color="var(--ks-red)" label={<Trans>SELLING</Trans>} symbol={makerCurrency?.wrapped.symbol} />

      <OrderSide reverse>
        {visibleSellOrders.length > 0
          ? visibleSellOrders.map(order => (
              <OrderRow key={order.id} order={order} showInvertedRate={showInvertedRate} onTake={handleTakeOrder} />
            ))
          : isOrdersLoaded && <NoDataPanel />}
      </OrderSide>

      <RowWrapper className="bg-background px-4 py-3 text-xl font-medium leading-6">
        <span className="flex items-center justify-center">
          <img className="size-5" src={networkInfo?.icon} alt="Network" />
        </span>
        <button
          type="button"
          className="col-start-4 justify-self-end border-none bg-transparent p-0 text-right text-inherit hover:brightness-75 max-sm:col-start-2"
          onClick={handleSetMarketRate}
          disabled={!marketRate || !invertRate}
          aria-label="Set market rate"
        >
          {displayedMarketRate ? formatDisplayNumber(displayedMarketRate, { significantDigits: 6 }) : '--'}
        </button>
        <span className="col-start-5 justify-self-start max-sm:col-start-3">
          <button
            type="button"
            className="flex items-center gap-1 border-none bg-transparent p-0 text-sm transition hover:brightness-75"
            onClick={handleInvertRate}
            aria-label="Invert rate"
          >
            <span>{displayedRatePair}</span>
            <Repeat size={14} />
          </button>
        </span>
        <div className="col-start-7 justify-self-end max-sm:hidden">
          <RefreshLoading clickable refetchLoading={refetchLoading} onRefresh={onRefreshOrders} />
        </div>
      </RowWrapper>

      <SectionLabel color="var(--ks-primary)" label={<Trans>BUYING</Trans>} symbol={makerCurrency?.wrapped.symbol} />

      <OrderSide>
        {visibleBuyOrders.length > 0
          ? visibleBuyOrders.map(order => (
              <OrderRow
                key={order.id}
                reverse
                order={order}
                showInvertedRate={showInvertedRate}
                onTake={handleTakeOrder}
              />
            ))
          : isReversedOrdersLoaded && <NoDataPanel />}
      </OrderSide>

      {selectedOrderToTake && (
        <TakeOrderConfirmModal
          isOpen={isTakeOrderModalOpen}
          order={selectedOrderToTake}
          onDismiss={handleDismissTakeOrderModal}
        />
      )}
    </div>
  )
}

export default OrderBook
