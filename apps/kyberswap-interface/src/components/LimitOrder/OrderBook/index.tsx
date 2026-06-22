import type { Token as SchemaToken } from '@kyber/schema'
import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { useGetOrdersByTokenPairQuery } from 'services/limitOrder'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import OrderItem, { ItemWrapper } from 'components/LimitOrder/OrderBook/OrderItem'
import TableHeader from 'components/LimitOrder/OrderBook/TableHeader'
import TakeOrderConfirmModal from 'components/LimitOrder/TakeOrder/TakeOrderConfirmModal'
import { getMarketPriceDiff } from 'components/LimitOrder/helpers'
import { LimitOrderFromTokenPair, LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import RefreshLoading from 'components/RefreshLoading'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import { useBaseTradeInfoLimitOrder } from 'hooks/useBaseTradeInfo'
import RefetchIndicator from 'pages/Earns/components/RefetchIndicator'
import { getDefaultRevertPrice as getDefaultInvertPrice } from 'pages/Earns/utils'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitState } from 'state/limit/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const safeDivide = (numerator: JSBI, denominator: JSBI) =>
  JSBI.equal(denominator, JSBI.BigInt(0)) ? JSBI.BigInt(0) : JSBI.divide(numerator, denominator)

const invertRateValue = (value: string | number | undefined) => {
  const numberValue = Number(value)
  if (!numberValue || !Number.isFinite(numberValue)) return undefined
  return 1 / numberValue
}

const getSchemaToken = (currency: Currency | undefined, isStable: boolean): SchemaToken | undefined => {
  if (!currency) return undefined

  return {
    address: currency.wrapped.address,
    symbol: currency.symbol || '',
    name: currency.name || '',
    decimals: currency.decimals,
    isStable,
  }
}

const refetchSafely = (refetch: () => { catch?: (onRejected: () => void) => unknown } | void) => {
  try {
    refetch()?.catch?.(() => {})
  } catch {}
}

const NoDataPanel = () => (
  <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 text-sm font-medium text-subText">
    <NoDataIcon />
    <Trans>No orders</Trans>
  </div>
)

const formatOrders = (
  orders: LimitOrderFromTokenPair[],
  makerCurrency: Currency | undefined,
  takerCurrency: Currency | undefined,
  marketRate: number,
  reverse = false,
): LimitOrderFromTokenPairFormatted[] => {
  if (!makerCurrency || !takerCurrency) return []

  return orders
    .map(order => {
      const newMakerCurrency = new Token(
        order.chainId,
        order.makerAsset,
        order.makerAssetDecimals,
        order.makerAssetSymbol || makerCurrency.symbol,
      )
      const newTakerCurrency = new Token(
        order.chainId,
        order.takerAsset,
        order.takerAssetDecimals,
        order.takerAssetSymbol || takerCurrency.symbol,
      )

      const makerCurrencyAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.makingAmount)
      const takerCurrencyAmount = CurrencyAmount.fromRawAmount(newTakerCurrency, order.takingAmount)
      const availableMakerCurrencyAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.availableMakingAmount)

      const rate = (
        !reverse
          ? takerCurrencyAmount.divide(makerCurrencyAmount).multiply(makerCurrencyAmount.decimalScale)
          : makerCurrencyAmount.divide(takerCurrencyAmount).multiply(takerCurrencyAmount.decimalScale)
      ).toSignificant(100)

      const filledMakingAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.filledMakingAmount)
      const filledPercent = (parseFloat(filledMakingAmount.toExact()) / parseFloat(makerCurrencyAmount.toExact())) * 100
      const makerAmount = makerCurrencyAmount.toExact()
      const takerAmount = takerCurrencyAmount.toExact()
      const availableMakerAmount = availableMakerCurrencyAmount.toExact()
      const availableTakerAmount = CurrencyAmount.fromRawAmount(
        newTakerCurrency,
        safeDivide(
          JSBI.multiply(JSBI.BigInt(order.takingAmount), JSBI.BigInt(order.availableMakingAmount)),
          JSBI.BigInt(order.makingAmount),
        ),
      ).toExact()
      const hasAvailable = parseFloat(availableMakerAmount) > 0
      const marketDiff = getMarketPriceDiff(rate, marketRate)
      const invertedRate = invertRateValue(rate)
      const invertedMarketDiff = getMarketPriceDiff(invertedRate, invertRateValue(marketRate))

      return {
        id: order.id,
        chainId: order.chainId,
        rawOrder: order,
        isReversed: reverse,
        hasAvailable,
        formattedMakerAmount: formatDisplayNumber(makerAmount, { significantDigits: 6 }),
        formattedTakerAmount: formatDisplayNumber(takerAmount, { significantDigits: 6 }),
        formattedAvailableMakerAmount: hasAvailable
          ? formatDisplayNumber(availableMakerAmount, { significantDigits: 6 })
          : '',
        formattedAvailableTakerAmount: hasAvailable
          ? formatDisplayNumber(availableTakerAmount, { significantDigits: 6 })
          : '',
        rate,
        formattedRate: formatDisplayNumber(rate, { significantDigits: 6 }),
        invertedRate: invertedRate?.toString() || '',
        formattedInvertedRate: invertedRate ? formatDisplayNumber(invertedRate, { significantDigits: 6 }) : '--',
        formattedMarketDiffPercent: marketDiff.displayPercent,
        formattedInvertedMarketDiffPercent: invertedMarketDiff.displayPercent,
        marketDiffPercent: reverse ? -marketDiff.rawPercent : marketDiff.rawPercent,
        filledPercent: filledPercent > 99 ? '100' : filledPercent.toFixed(),
      }
    })
    .filter(order => order.filledPercent !== '100')
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
}

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
      style={{ height: 336, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}

const OrderBook = () => {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()
  const { isStableCoin } = useStableCoins(chainId)

  const [selectedOrderToTake, setSelectedOrderToTake] = useState<LimitOrderFromTokenPairFormatted>()
  const [isTakeOrderModalOpen, setIsTakeOrderModalOpen] = useState(false)
  const [invertedRateOverride, setInvertedRateOverride] = useState<{ pairKey: string; value: boolean }>()

  const {
    loading: loadingMarketRate,
    tradeInfo: { marketRate = 0 } = {},
    refetch: refetchMarketRate,
  } = useBaseTradeInfoLimitOrder(makerCurrency, takerCurrency, chainId)

  const {
    data: { orders = [] } = {},
    isFetching: isFetchingOrders,
    isSuccess: isOrdersLoaded,
    refetch: refetchOrders,
  } = useGetOrdersByTokenPairQuery({
    chainId,
    makerAsset: makerCurrency?.wrapped?.address,
    takerAsset: takerCurrency?.wrapped?.address,
  })

  const {
    data: { orders: reversedOrders = [] } = {},
    isFetching: isFetchingReversedOrder,
    isSuccess: isReversedOrdersLoaded,
    refetch: refetchReversedOrders,
  } = useGetOrdersByTokenPairQuery({
    chainId,
    makerAsset: takerCurrency?.wrapped?.address,
    takerAsset: makerCurrency?.wrapped?.address,
  })

  const refetchLoading = loadingMarketRate || isFetchingOrders || isFetchingReversedOrder

  const formattedOrders = useMemo(
    () => formatOrders(orders, makerCurrency, takerCurrency, marketRate),
    [orders, makerCurrency, takerCurrency, marketRate],
  )
  const formattedReversedOrders = useMemo(
    () => formatOrders(reversedOrders, takerCurrency, makerCurrency, marketRate, true),
    [reversedOrders, takerCurrency, makerCurrency, marketRate],
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
    ? `${takerCurrency?.symbol}/${makerCurrency?.symbol}`
    : `${makerCurrency?.symbol}/${takerCurrency?.symbol}`

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
    if (!account) {
      toggleWalletModal()
      return
    }
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
      <SectionLabel color="var(--ks-red)" label={<Trans>SELLING</Trans>} symbol={makerCurrency?.symbol} />

      <OrderSide reverse>
        {visibleSellOrders.length > 0
          ? visibleSellOrders.map(order => (
              <OrderItem key={order.id} order={order} showInvertedRate={showInvertedRate} onTake={handleTakeOrder} />
            ))
          : isOrdersLoaded && <NoDataPanel />}
      </OrderSide>

      <ItemWrapper className="bg-background px-4 py-3 text-xl font-medium leading-6">
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
      </ItemWrapper>

      <SectionLabel color="var(--ks-primary)" label={<Trans>BUYING</Trans>} symbol={makerCurrency?.symbol} />

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
