import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useGetStopOrdersQuery } from 'services/stopOrder'

import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import CancelStopOrderModal from 'components/StopOrder/CancelOrder/CancelStopOrderModal'
import { useStopOrderOraclePrice } from 'components/StopOrder/hooks/useStopOrderOraclePrice'
import { StopOrder, StopOrderStatus } from 'components/StopOrder/types'
import {
  getStopOrderDisplayStatus,
  getStopOrderTriggerPrice,
  isActiveStopOrderStatus,
} from 'components/StopOrder/utils'
import type { PriceMarkerGroup } from 'components/TokenPriceChart/priceMarkers'
import { isSupportStopOrder } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'

const EMPTY_ORDERS: StopOrder[] = []

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
}

/**
 * The user's open stop orders on the pair, as lines for its price chart, which prices the sell token
 * in the receive token — the unit every trigger is set in. Orders the other way round — selling the
 * receive token for the sell token — are drawn too, at the inverse of their trigger, so every order on
 * the pair shows on one scale. `referencePrice` is the oracle price the triggers are checked against,
 * and `modal` the cancel confirmation a line's details open, to render beside the chart.
 */
export const useStopOrderPriceMarkers = ({ currencyIn, currencyOut }: Props) => {
  const { account } = useActiveWeb3React()
  const [cancelTargets, setCancelTargets] = useState<StopOrder[]>([])
  // The list keeps returning a cancelled order as Open until the service catches up; its line and
  // cancel button must not outlive the cancel.
  const [cancelledIds, setCancelledIds] = useState<number[]>([])

  const chainId = currencyIn?.chainId as ChainId | undefined
  const tokenIn = currencyIn?.wrapped.address.toLowerCase()
  const tokenOut = currencyOut?.wrapped.address.toLowerCase()
  // Nothing to draw on a chain that takes no stop orders.
  const hasPair = !!chainId && isSupportStopOrder(chainId) && !!tokenIn && !!tokenOut && tokenIn !== tokenOut

  const { currentData } = useGetStopOrdersQuery(
    {
      userWallet: account || '',
      chainIds: chainId ? [chainId] : undefined,
      statuses: [StopOrderStatus.OPEN],
      // Both directions: an order's tokens are always different, so these match the pair either way round.
      tokenIns: tokenIn && tokenOut ? [tokenIn, tokenOut] : undefined,
      tokenOuts: tokenIn && tokenOut ? [tokenOut, tokenIn] : undefined,
      page: 1,
      pageSize: 100,
    },
    { skip: !account || !hasPair, pollingInterval: 10_000 },
  )

  /** Whether the order sells the receive token for the sell token, against the chart's direction. */
  const isReversed = useCallback(
    (order: StopOrder) => order.tokenIn.toLowerCase() === tokenOut && order.tokenOut.toLowerCase() === tokenIn,
    [tokenIn, tokenOut],
  )

  const orders = useMemo(
    () =>
      (currentData?.orders ?? EMPTY_ORDERS).filter(
        order =>
          ((order.tokenIn.toLowerCase() === tokenIn && order.tokenOut.toLowerCase() === tokenOut) ||
            isReversed(order)) &&
          !cancelledIds.includes(order.id) &&
          isActiveStopOrderStatus(getStopOrderDisplayStatus(order)),
      ),
    [currentData?.orders, tokenIn, tokenOut, isReversed, cancelledIds],
  )

  const { price: oraclePrice, priceNumber: oraclePriceNumber } = useStopOrderOraclePrice(
    currencyIn,
    currencyOut,
    chainId,
  )

  // The oracle line is in the chart's unit: the receive token per sell token.
  const chartQuoteSymbol = currencyOut?.symbol

  const renderDetails = useCallback(
    (markerIds: string[]) => {
      const shown = markerIds
        .map(id => orders.find(order => String(order.id) === id))
        .filter((order): order is StopOrder => !!order)

      return (
        <Stack className="min-w-[220px] gap-2.5 text-xs">
          {shown.map(order => {
            // Each order reads in its own direction and trigger, the way it was placed.
            const reversed = isReversed(order)
            const sellCurrency = reversed ? currencyOut : currencyIn
            const sellSymbol = sellCurrency?.wrapped.symbol
            const receiveSymbol = reversed ? currencyIn?.symbol : currencyOut?.symbol
            const amount = sellCurrency
              ? CurrencyAmount.fromRawAmount(sellCurrency.wrapped, order.amountIn).toSignificant(6)
              : '--'
            const trigger = formatDisplayNumber(getStopOrderTriggerPrice(order), { significantDigits: 6 })
            return (
              <HStack key={order.id} className="items-start justify-between gap-3" data-testid="price-marker-order">
                <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
                  <span className="text-subText">
                    <Trans>Sell</Trans>
                  </span>
                  <span className="font-medium text-text">
                    {amount} {sellSymbol} → {receiveSymbol}
                  </span>
                  <span className="text-subText">
                    <Trans>Trigger</Trans>
                  </span>
                  <span className="font-medium text-warning">
                    {trigger} {receiveSymbol}
                  </span>
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
          {oraclePrice && (
            <HStack className="justify-between gap-3 border-t border-border pt-2">
              <span className="text-subText">
                <Trans>Oracle</Trans>
              </span>
              <span className="font-medium text-text">
                {formatDisplayNumber(oraclePrice, { significantDigits: 6 })} {chartQuoteSymbol}
              </span>
            </HStack>
          )}
        </Stack>
      )
    },
    [orders, isReversed, currencyIn, currencyOut, chartQuoteSymbol, oraclePrice],
  )

  const group = useMemo<PriceMarkerGroup | undefined>(() => {
    if (!hasPair) return undefined
    return {
      key: 'stop',
      markers: orders
        .map(order => {
          const trigger = Number(getStopOrderTriggerPrice(order))
          // A trigger fires as its own price falls, which on the chart's inverted scale is a rise.
          return isReversed(order)
            ? { id: String(order.id), price: 1 / trigger, crossing: 'up' as const }
            : { id: String(order.id), price: trigger, crossing: 'down' as const }
        })
        .filter(marker => Number.isFinite(marker.price) && marker.price > 0),
      label: t`STOP`,
      tone: 'warning',
      renderDetails,
    }
  }, [hasPair, orders, isReversed, renderDetails])

  const modal = (
    <CancelStopOrderModal
      orders={cancelTargets}
      isCancelAll={false}
      onDismiss={() => setCancelTargets([])}
      onCancelled={orderIds => setCancelledIds(ids => [...ids, ...orderIds])}
    />
  )

  return { group, referencePrice: oraclePriceNumber, modal }
}
