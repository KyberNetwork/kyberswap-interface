import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useGetStopMarketsQuery } from 'services/stopMarket'

import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import CancelStopMarketModal from 'components/StopMarket/CancelOrder/CancelStopMarketModal'
import { useStopMarketOraclePrice } from 'components/StopMarket/hooks/useStopMarketOraclePrice'
import { StopMarket, StopMarketStatus } from 'components/StopMarket/types'
import {
  getStopMarketDisplayStatus,
  getStopMarketPairKey,
  getStopMarketTriggerPrice,
  isActiveStopMarketStatus,
} from 'components/StopMarket/utils'
import type { PriceMarkerGroup } from 'components/TokenPriceChart/priceMarkers'
import { ETHER_ADDRESS } from 'constants/index'
import { isSupportStopMarket } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'

const EMPTY_ORDERS: StopMarket[] = []

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  /** Off while the chart draws no stop market orders, so nothing is fetched for them. */
  enabled: boolean
  /** Also fetch the oracle price the triggers are checked against, for the reference line and the details. */
  withOraclePrice: boolean
}

/**
 * The user's open stop market orders on the pair, as lines for its price chart, which prices the sell token
 * in the receive token — the unit every trigger is set in. Orders the other way round — selling the
 * receive token for the sell token — are drawn too, at the inverse of their trigger, so every order on
 * the pair shows on one scale. `referencePrice` is the oracle price the triggers are checked against,
 * and `modal` the cancel confirmation a line's details open, to render beside the chart.
 */
export const useStopMarketPriceMarkers = ({ currencyIn, currencyOut, enabled, withOraclePrice }: Props) => {
  const { account } = useActiveWeb3React()
  const [cancelTargets, setCancelTargets] = useState<StopMarket[]>([])
  // The list keeps returning a cancelled order as Open until the service catches up; its line and
  // cancel button must not outlive the cancel.
  const [cancelledIds, setCancelledIds] = useState<number[]>([])

  const chainId = currencyIn?.chainId as ChainId | undefined
  const tokenIn = currencyIn?.wrapped.address.toLowerCase()
  const tokenOut = currencyOut?.wrapped.address.toLowerCase()
  // Nothing to draw on a chain that takes no stop market orders.
  const hasPair =
    enabled && !!chainId && isSupportStopMarket(chainId) && !!tokenIn && !!tokenOut && tokenIn !== tokenOut
  // An order paying out native currency names it by the placeholder address rather than the wrapped token,
  // so a pair holding the wrapped token asks for that address too. Only as a token out: a native sell is
  // always wrapped.
  const tokenOuts = useMemo(() => {
    if (!chainId || !tokenIn || !tokenOut) return undefined
    const holdsWrappedNative = [tokenIn, tokenOut].includes(WETH[chainId].address.toLowerCase())
    return holdsWrappedNative ? [tokenOut, tokenIn, ETHER_ADDRESS.toLowerCase()] : [tokenOut, tokenIn]
  }, [chainId, tokenIn, tokenOut])

  const { currentData } = useGetStopMarketsQuery(
    {
      userWallet: account || '',
      chainIds: chainId ? [chainId] : undefined,
      statuses: [StopMarketStatus.OPEN],
      // Both directions: an order's tokens are always different, so these match the pair either way round.
      tokenIns: tokenIn && tokenOut ? [tokenIn, tokenOut] : undefined,
      tokenOuts,
      page: 1,
      pageSize: 100,
    },
    { skip: !account || !hasPair, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )

  // Compared by pair key, which reads a native coin as its wrapped token, as the oracle prices it.
  const forwardKey = chainId && tokenIn && tokenOut ? getStopMarketPairKey(chainId, tokenIn, tokenOut) : undefined
  const reversedKey = chainId && tokenIn && tokenOut ? getStopMarketPairKey(chainId, tokenOut, tokenIn) : undefined

  /** Whether the order sells the receive token for the sell token, against the chart's direction. */
  const isReversed = useCallback(
    (order: StopMarket) => getStopMarketPairKey(order.chainId, order.tokenIn, order.tokenOut) === reversedKey,
    [reversedKey],
  )

  const orders = useMemo(
    () =>
      (currentData?.orders ?? EMPTY_ORDERS).filter(
        order =>
          (getStopMarketPairKey(order.chainId, order.tokenIn, order.tokenOut) === forwardKey || isReversed(order)) &&
          !cancelledIds.includes(order.id) &&
          isActiveStopMarketStatus(getStopMarketDisplayStatus(order)),
      ),
    [currentData?.orders, forwardKey, isReversed, cancelledIds],
  )

  // Without a sell token the feed is not asked for, which is how a chart that does not need it skips it.
  const { price: oraclePrice, priceNumber: oraclePriceNumber } = useStopMarketOraclePrice(
    hasPair && withOraclePrice ? currencyIn : undefined,
    currencyOut,
    chainId,
  )

  // The oracle price reads in the pair's own unit — the receive token per sell token, which every
  // trigger is set in — whichever way round the chart draws the pair.
  const oracleSymbol = currencyOut?.symbol

  const renderDetails = useCallback(
    (markerIds: string[]) => {
      const shown = markerIds
        .map(id => orders.find(order => String(order.id) === id))
        .filter((order): order is StopMarket => !!order)

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
            const trigger = formatDisplayNumber(getStopMarketTriggerPrice(order), { significantDigits: 6 })
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
                {formatDisplayNumber(oraclePrice, { significantDigits: 6 })} {oracleSymbol}
              </span>
            </HStack>
          )}
        </Stack>
      )
    },
    [orders, isReversed, currencyIn, currencyOut, oracleSymbol, oraclePrice],
  )

  const group = useMemo<PriceMarkerGroup | undefined>(() => {
    if (!hasPair) return undefined
    return {
      key: 'stop',
      markers: orders
        .map(order => {
          const trigger = Number(getStopMarketTriggerPrice(order))
          // A trigger fires as its own price falls, which on the chart's inverted scale is a rise.
          return isReversed(order)
            ? { id: String(order.id), price: 1 / trigger, crossing: 'up' as const }
            : { id: String(order.id), price: trigger, crossing: 'down' as const }
        })
        .filter(marker => Number.isFinite(marker.price) && marker.price > 0),
      label: t`STOP`,
      tone: 'warning',
      renderDetails,
      renderOffscreen: count => (count === 1 ? t`Stop Order` : t`Stop Orders`),
    }
  }, [hasPair, orders, isReversed, renderDetails])

  const modal = (
    <CancelStopMarketModal
      orders={cancelTargets}
      isCancelAll={false}
      onDismiss={() => setCancelTargets([])}
      onCancelled={orderIds => setCancelledIds(ids => [...ids, ...orderIds])}
    />
  )

  return { group, referencePrice: oraclePriceNumber, modal }
}
