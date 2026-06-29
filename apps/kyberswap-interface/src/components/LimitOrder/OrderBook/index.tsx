import { Trans } from '@lingui/macro'
import { skipToken } from '@reduxjs/toolkit/query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { useGetOrdersByTokenPairQuery } from 'services/limitOrder'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import OrderItem from 'components/LimitOrder/OrderBook/OrderItem'
import TableHeader, { RowWrapper } from 'components/LimitOrder/OrderBook/TableHeader'
import { formatOrders, getSchemaToken, invertRateValue } from 'components/LimitOrder/OrderBook/utils'
import TakeOrderConfirmModal from 'components/LimitOrder/TakeOrder/TakeOrderConfirmModal'
import { LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import RefetchIndicator from 'components/RefetchIndicator'
import RefreshLoading from 'components/RefreshLoading'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
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

const OrderSide = ({
  children,
  className,
  reverse,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { reverse?: boolean }) => {
  return (
    <div
      className={cn(
        'overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-disableText [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:rounded-full',
        reverse && 'flex flex-col-reverse',
        className,
      )}
      style={{ maxHeight: 56 * 6, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}

const OrderBook = () => {
  const { chainId, networkInfo } = useActiveWeb3React()
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()
  const { isStableCoin } = useStableCoins(chainId)

  const [selectedOrderToTake, setSelectedOrderToTake] = useState<LimitOrderFromTokenPairFormatted>()
  const [isTakeOrderModalOpen, setIsTakeOrderModalOpen] = useState(false)
  const [invertedRateOverride, setInvertedRateOverride] = useState<{ pairKey: string; value: boolean }>()

  const {
    loading: loadingMarketRate,
    tradeInfo: { marketRate = 0, priceUsdIn = 0, priceUsdOut = 0 } = {},
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
    () => formatOrders(orders, makerCurrency, takerCurrency, marketRate, priceUsdIn, priceUsdOut),
    [orders, makerCurrency, takerCurrency, marketRate, priceUsdIn, priceUsdOut],
  )
  const formattedReversedOrders = useMemo(
    () => formatOrders(reversedOrders, takerCurrency, makerCurrency, marketRate, priceUsdOut, priceUsdIn, true),
    [reversedOrders, takerCurrency, makerCurrency, marketRate, priceUsdOut, priceUsdIn],
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

    setInvertedRateOverride(current => ({
      pairKey: ratePairKey,
      value: !(current?.pairKey === ratePairKey ? current.value : defaultShowInvertedRate),
    }))
  }, [defaultShowInvertedRate, ratePairKey])

  const handleTakeOrder = (order: LimitOrderFromTokenPairFormatted) => {
    setSelectedOrderToTake(order)
    setIsTakeOrderModalOpen(true)
  }

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
              <OrderItem key={order.id} order={order} showInvertedRate={showInvertedRate} onTake={handleTakeOrder} />
            ))
          : isOrdersLoaded && <NoDataPanel />}
      </OrderSide>

      <RowWrapper className="bg-background px-4 py-3 text-xl font-medium leading-6">
        <span className="flex items-center justify-center">
          <img className="size-5" src={networkInfo?.icon} alt="Network" />
        </span>
        <span className="col-start-4 justify-self-end text-right max-[640px]:col-start-3">
          {displayedMarketRate ? formatDisplayNumber(displayedMarketRate, { significantDigits: 6 }) : '--'}
        </span>
        <span className="col-start-5 justify-self-start max-[640px]:col-start-4">
          <button
            type="button"
            className="flex items-center gap-1 border-none bg-transparent p-0 text-xs text-subText transition hover:brightness-125"
            onClick={handleInvertRate}
            aria-label="Invert rate"
          >
            <span>{displayedRatePair}</span>
            <Repeat size={14} />
          </button>
        </span>
        <div className="col-start-7 justify-self-end max-[640px]:hidden">
          <RefreshLoading clickable refetchLoading={refetchLoading} onRefresh={onRefreshOrders} />
        </div>
      </RowWrapper>

      <SectionLabel color="var(--ks-primary)" label={<Trans>BUYING</Trans>} symbol={makerCurrency?.wrapped.symbol} />

      <OrderSide>
        {visibleBuyOrders.length > 0
          ? visibleBuyOrders.map(order => (
              <OrderItem
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
