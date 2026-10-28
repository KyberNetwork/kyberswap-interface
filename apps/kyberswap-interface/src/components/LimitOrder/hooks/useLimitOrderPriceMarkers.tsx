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
import type { PriceMarkerGroup } from 'components/TokenPriceChart/priceMarkers'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'

const EMPTY_ORDERS: LimitOrder[] = []

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  /** Off while the chart draws no limit orders, so nothing is fetched for them. */
  enabled: boolean
}

/**
 * The user's open limit orders on the pair, as lines for its price chart, which prices the sell token
 * in the receive token — the unit an order's rate is set in. Orders the other way round — selling the
 * receive token for the sell token — are drawn too, at the inverse of their rate, so every order on the
 * pair shows on one scale. `modal` is the cancel confirmation a line's details open, to render beside
 * the chart.
 */
export const useLimitOrderPriceMarkers = ({ currencyIn, currencyOut, enabled }: Props) => {
  const { account } = useActiveWeb3React()
  const [cancelTargets, setCancelTargets] = useState<LimitOrder[]>([])

  const chainId = (currencyIn?.chainId ?? ChainId.MAINNET) as ChainId
  const makerAsset = currencyIn?.wrapped.address.toLowerCase()
  const takerAsset = currencyOut?.wrapped.address.toLowerCase()
  const hasPair = enabled && !!currencyIn && !!makerAsset && !!takerAsset && makerAsset !== takerAsset

  // The list has no pair filter, but its search takes a token address and matches it on either side,
  // so asking by the sell token brings back this pair's orders in both directions; the exact pair is
  // picked out below. A pair of addresses is not accepted, and symbols can collide between tokens.
  const { currentData } = useGetListOrdersQuery(
    {
      chainIds: [chainId],
      maker: account,
      status: LimitOrderStatus.ACTIVE,
      query: makerAsset,
      page: 1,
      pageSize: 100,
    },
    { skip: !account || !hasPair, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )
  // A cancel takes a while to reach the list; its line and cancel button must not outlive it.
  const { isOrderCancelling, setCancellingOrders } = useCancellingOrders({ chainId })

  /** Whether the order sells the receive token for the sell token, against the chart's direction. */
  const isReversed = useCallback(
    (order: LimitOrder) =>
      order.makerAsset.toLowerCase() === takerAsset && order.takerAsset.toLowerCase() === makerAsset,
    [makerAsset, takerAsset],
  )

  const orders = useMemo(
    () =>
      (currentData?.orders ?? EMPTY_ORDERS).filter(
        order =>
          ((order.makerAsset.toLowerCase() === makerAsset && order.takerAsset.toLowerCase() === takerAsset) ||
            isReversed(order)) &&
          isActiveStatus(order.status) &&
          !isOrderCancelling(order),
      ),
    [currentData?.orders, makerAsset, takerAsset, isReversed, isOrderCancelling],
  )

  const renderDetails = useCallback(
    (markerIds: string[]) => {
      const shown = markerIds
        .map(id => orders.find(order => String(order.id) === id))
        .filter((order): order is LimitOrder => !!order)

      return (
        <Stack className="min-w-[244px] text-xs">
          {shown.map(order => {
            // Each order reads in its own direction and rate, the way it was placed.
            const reversed = isReversed(order)
            const sellSymbol = reversed ? currencyOut?.wrapped.symbol : currencyIn?.wrapped.symbol
            const receiveSymbol = reversed ? currencyIn?.symbol : currencyOut?.symbol
            const remaining = (BigInt(order.makingAmount) - BigInt(order.filledMakingAmount)).toString()
            const rate = formatDisplayNumber(getOrderRate(order), { significantDigits: 6 })
            const filled = calcPercentFilledOrder(
              order.filledTakingAmount,
              order.takingAmount,
              order.takerAssetDecimals,
            )
            return (
              <HStack
                key={order.id}
                className="items-start justify-between gap-3 px-3 py-2.5 transition-colors focus-within:bg-white/5 hover:bg-white/5"
                data-testid="price-marker-order"
              >
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
                  <span className="font-medium text-blue">
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
    [orders, isReversed, currencyIn, currencyOut],
  )

  const group = useMemo<PriceMarkerGroup | undefined>(() => {
    if (!hasPair) return undefined
    return {
      key: 'limit',
      markers: orders
        .map(order => {
          const rate = Number(getOrderRate(order))
          // An order fills once its own price rises to the rate, which on the chart's inverted scale is a fall.
          return isReversed(order)
            ? { id: String(order.id), price: 1 / rate, crossing: 'down' as const }
            : { id: String(order.id), price: rate, crossing: 'up' as const }
        })
        .filter(marker => Number.isFinite(marker.price) && marker.price > 0),
      label: t`LIMIT`,
      tone: 'blue',
      renderDetails,
      renderOffscreen: count => (count === 1 ? t`Limit Order` : t`Limit Orders`),
    }
  }, [hasPair, orders, isReversed, renderDetails])

  const modal = (
    <CancelOrderModal
      isOpen={cancelTargets.length > 0}
      onDismiss={() => setCancelTargets([])}
      isCancelAll={false}
      orders={cancelTargets}
      onOrdersCancelling={setCancellingOrders}
    />
  )

  return { group, modal }
}
