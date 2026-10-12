import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useGetListOrdersQuery } from 'services/limitOrder'

import IconButton from 'components/Button/IconButton'
import CancelOrderModal from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { useCancellingOrders } from 'components/LimitOrder/CancelOrder/useCancellingOrders'
import { formatOrderDisplayAmount, getOrderRate } from 'components/LimitOrder/MyOrders/utils'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { calcPercentFilledOrder, isActiveStatus } from 'components/LimitOrder/utils'
import { HStack, Stack } from 'components/Stack'
import TokenPriceChart from 'components/TokenPriceChart'
import type { PriceMarkerOverlay } from 'components/TokenPriceChart/priceMarkers'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'

const EMPTY_ORDERS: LimitOrder[] = []

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
}

/**
 * The pair's price chart with the user's open limit orders drawn across it. The chart prices the sell
 * token in the receive token, the unit an order's rate is set in, and draws only the orders selling
 * this pair's sell token for its receive token.
 */
const LimitOrderPriceChart = ({ currencyIn, currencyOut }: Props) => {
  const { account } = useActiveWeb3React()
  const [cancelTargets, setCancelTargets] = useState<LimitOrder[]>([])

  const chainId = (currencyIn?.chainId ?? ChainId.MAINNET) as ChainId
  const makerAsset = currencyIn?.wrapped.address.toLowerCase()
  const takerAsset = currencyOut?.wrapped.address.toLowerCase()
  const hasPair = !!currencyIn && !!makerAsset && !!takerAsset && makerAsset !== takerAsset

  // The list cannot filter by pair, so the chain's open orders are fetched and narrowed here.
  const { currentData } = useGetListOrdersQuery(
    { chainIds: [chainId], maker: account, status: LimitOrderStatus.ACTIVE, page: 1, pageSize: 100 },
    { skip: !account || !hasPair, pollingInterval: 10_000 },
  )
  // A cancel takes a while to reach the list; its line and cancel button must not outlive it.
  const { isOrderCancelling, setCancellingOrders } = useCancellingOrders({ chainId })

  const orders = useMemo(
    () =>
      (currentData?.orders ?? EMPTY_ORDERS).filter(
        order =>
          order.makerAsset.toLowerCase() === makerAsset &&
          order.takerAsset.toLowerCase() === takerAsset &&
          isActiveStatus(order.status) &&
          !isOrderCancelling(order),
      ),
    [currentData?.orders, makerAsset, takerAsset, isOrderCancelling],
  )

  const sellSymbol = currencyIn?.wrapped.symbol
  const receiveSymbol = currencyOut?.symbol

  const renderDetails = useCallback(
    (markerIds: string[]) => {
      const shown = markerIds
        .map(id => orders.find(order => String(order.id) === id))
        .filter((order): order is LimitOrder => !!order)

      return (
        <Stack className="min-w-[220px] gap-2.5 text-xs">
          {shown.map(order => {
            const remaining = (BigInt(order.makingAmount) - BigInt(order.filledMakingAmount)).toString()
            const rate = formatDisplayNumber(getOrderRate(order), { significantDigits: 6 })
            const filled = calcPercentFilledOrder(
              order.filledTakingAmount,
              order.takingAmount,
              order.takerAssetDecimals,
            )
            return (
              <HStack key={order.id} className="items-start justify-between gap-3" data-testid="price-marker-order">
                <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
                  <span className="text-subText">
                    <Trans>Sell</Trans>
                  </span>
                  <span className="font-medium text-text">
                    {formatOrderDisplayAmount(remaining, order.makerAssetDecimals)} {sellSymbol} → {receiveSymbol}
                  </span>
                  <span className="text-subText">
                    <Trans>Rate</Trans>
                  </span>
                  <span className="font-medium text-warning">
                    {rate} {receiveSymbol}
                  </span>
                  <span className="text-subText">
                    <Trans>Filled</Trans>
                  </span>
                  <span className="font-medium text-text">{filled}%</span>
                </div>
                <IconButton
                  onClick={() => setCancelTargets([order])}
                  aria-label={t`Cancel order`}
                  data-testid="price-marker-cancel-button"
                  className="size-6 shrink-0 bg-buttonGray p-0 text-subText hover:text-red"
                >
                  <Trash size={14} />
                </IconButton>
              </HStack>
            )
          })}
        </Stack>
      )
    },
    [orders, sellSymbol, receiveSymbol],
  )

  const markerOverlay = useMemo<PriceMarkerOverlay | undefined>(() => {
    if (!hasPair) return undefined
    return {
      markers: orders
        .map(order => ({ id: String(order.id), price: Number(getOrderRate(order)) }))
        .filter(marker => Number.isFinite(marker.price) && marker.price > 0),
      label: t`LIMIT`,
      renderDetails,
      renderOffscreen: (count, direction) =>
        direction === 'above' ? t`${count} order(s) above` : t`${count} order(s) below`,
    }
  }, [hasPair, orders, renderDetails])

  return (
    <>
      {/* One element for both cases, so resolving the pair re-renders the chart rather than remounting it. */}
      <TokenPriceChart
        flatten
        tokens={hasPair ? [currencyIn] : [currencyIn, currencyOut]}
        quoteCurrency={hasPair ? currencyOut : undefined}
        markerOverlay={markerOverlay}
      />
      <CancelOrderModal
        isOpen={cancelTargets.length > 0}
        onDismiss={() => setCancelTargets([])}
        isCancelAll={false}
        orders={cancelTargets}
        onOrdersCancelling={setCancellingOrders}
      />
    </>
  )
}

export default LimitOrderPriceChart
