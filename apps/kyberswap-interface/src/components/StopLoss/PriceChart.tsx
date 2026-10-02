import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useGetStopLossOrdersQuery } from 'services/stopLoss'

import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import CancelStopLossModal from 'components/StopLoss/CancelOrder/CancelStopLossModal'
import { useStopLossOraclePrice } from 'components/StopLoss/hooks/useStopLossOraclePrice'
import { StopLossOrder, StopLossOrderStatus } from 'components/StopLoss/types'
import { getStopLossDisplayStatus, getStopLossTriggerPrice, isActiveStopLossStatus } from 'components/StopLoss/utils'
import TokenPriceChart from 'components/TokenPriceChart'
import type { PriceMarkerOverlay } from 'components/TokenPriceChart/priceMarkers'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'

const EMPTY_ORDERS: StopLossOrder[] = []

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
}

/**
 * The pair's price chart with the user's open stop-loss orders drawn across it. The chart prices the
 * sell token in the receive token, the unit every trigger is set in, and shows the oracle price the
 * triggers are checked against instead of the last candle's close. Only orders selling this pair's
 * sell token for its receive token are drawn.
 */
const StopLossPriceChart = ({ currencyIn, currencyOut }: Props) => {
  const { account } = useActiveWeb3React()
  const [cancelTargets, setCancelTargets] = useState<StopLossOrder[]>([])
  // The list keeps returning a cancelled order as Open until the service catches up; its line and
  // cancel button must not outlive the cancel.
  const [cancelledIds, setCancelledIds] = useState<number[]>([])

  const chainId = currencyIn?.chainId as ChainId | undefined
  const tokenIn = currencyIn?.wrapped.address.toLowerCase()
  const tokenOut = currencyOut?.wrapped.address.toLowerCase()
  const hasPair = !!chainId && !!tokenIn && !!tokenOut && tokenIn !== tokenOut

  const { currentData } = useGetStopLossOrdersQuery(
    {
      userWallet: account || '',
      chainIds: chainId ? [chainId] : undefined,
      status: StopLossOrderStatus.OPEN,
      tokenIns: tokenIn ? [tokenIn] : undefined,
      tokenOuts: tokenOut ? [tokenOut] : undefined,
      page: 1,
      pageSize: 100,
    },
    { skip: !account || !hasPair, pollingInterval: 10_000 },
  )

  const orders = useMemo(
    () =>
      (currentData?.orders ?? EMPTY_ORDERS).filter(
        order =>
          order.tokenIn.toLowerCase() === tokenIn &&
          order.tokenOut.toLowerCase() === tokenOut &&
          !cancelledIds.includes(order.id) &&
          isActiveStopLossStatus(getStopLossDisplayStatus(order)),
      ),
    [currentData?.orders, tokenIn, tokenOut, cancelledIds],
  )

  const { price: oraclePrice, priceNumber: oraclePriceNumber } = useStopLossOraclePrice(
    currencyIn,
    currencyOut,
    chainId,
  )

  const sellSymbol = currencyIn?.wrapped.symbol
  const receiveSymbol = currencyOut?.symbol

  const renderDetails = useCallback(
    (markerIds: string[]) => {
      const shown = markerIds
        .map(id => orders.find(order => String(order.id) === id))
        .filter((order): order is StopLossOrder => !!order)

      return (
        <Stack className="min-w-[220px] gap-2.5 text-xs">
          {shown.map(order => {
            const amount = currencyIn
              ? CurrencyAmount.fromRawAmount(currencyIn.wrapped, order.amountIn).toSignificant(6)
              : '--'
            const trigger = formatDisplayNumber(getStopLossTriggerPrice(order), { significantDigits: 6 })
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
                {formatDisplayNumber(oraclePrice, { significantDigits: 6 })} {receiveSymbol}
              </span>
            </HStack>
          )}
        </Stack>
      )
    },
    [orders, currencyIn, sellSymbol, receiveSymbol, oraclePrice],
  )

  const markerOverlay = useMemo<PriceMarkerOverlay | undefined>(() => {
    if (!hasPair) return undefined
    return {
      markers: orders
        .map(order => ({ id: String(order.id), price: Number(getStopLossTriggerPrice(order)) }))
        .filter(marker => Number.isFinite(marker.price) && marker.price > 0),
      label: t`STOP`,
      referencePrice: oraclePriceNumber,
      renderDetails,
      renderOffscreen: (count, direction) =>
        direction === 'above' ? t`${count} order(s) above` : t`${count} order(s) below`,
    }
  }, [hasPair, orders, oraclePriceNumber, renderDetails])

  return (
    <>
      {/* One element for both cases, so resolving the pair re-renders the chart rather than remounting it. */}
      <TokenPriceChart
        flatten
        tokens={hasPair ? [currencyIn] : [currencyIn, currencyOut]}
        quoteCurrency={hasPair ? currencyOut : undefined}
        markerOverlay={markerOverlay}
      />
      <CancelStopLossModal
        orders={cancelTargets}
        isCancelAll={false}
        onDismiss={() => setCancelTargets([])}
        onCancelled={orderIds => setCancelledIds(ids => [...ids, ...orderIds])}
      />
    </>
  )
}

export default StopLossPriceChart
