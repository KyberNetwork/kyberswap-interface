import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { StopLossOrder } from 'components/StopLoss/types'
import { getStopLossTriggerPrice } from 'components/StopLoss/utils'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'

type OrderContext = {
  currencyIn?: Currency
  currencyOut?: Currency
  chainId: number
  inputAmount: string
  triggerPrice: string
  triggerPercent?: number
  slippage: number
  expiredAt: number
}

const pairOf = (currencyIn?: Currency, currencyOut?: Currency) =>
  `${currencyIn?.symbol ?? ''}/${currencyOut?.symbol ?? ''}`

/** Feeds the funnel described in the spec: entry point → review → placed, split by source. */
export const useStopLossTracking = () => {
  const { trackingHandler } = useTracking()

  return useMemo(
    () => ({
      trackPageViewed: (chainId: number, source: string) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_PAGE_VIEWED, { chain: NETWORKS_INFO[chainId as ChainId]?.name, source }),

      trackTokenSelected: (currency: Currency) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_TOKEN_SELECTED, {
          token: currency.symbol,
          chain: NETWORKS_INFO[currency.chainId]?.name,
        }),

      trackReviewOpened: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_REVIEW_OPENED, {
          pair: pairOf(context.currencyIn, context.currencyOut),
          amount: context.inputAmount,
          trigger_pct_below: context.triggerPercent,
        }),

      trackOrderPlaced: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_ORDER_PLACED, {
          pair: pairOf(context.currencyIn, context.currencyOut),
          chain: NETWORKS_INFO[context.chainId as ChainId]?.name,
          amount: context.inputAmount,
          trigger_price: context.triggerPrice,
          trigger_pct_below: context.triggerPercent,
          slippage: context.slippage,
          expiry: context.expiredAt,
          order_type: 'stoploss',
        }),

      trackOrderCancelled: (order: StopLossOrder) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_ORDER_CANCELLED, {
          order_id: order.id,
          chain: NETWORKS_INFO[order.chainId]?.name,
          trigger_price: getStopLossTriggerPrice(order),
          order_age_hours: Math.round((Date.now() / 1000 - order.createdAt) / 3600),
        }),

      trackRecreateClicked: (order: StopLossOrder, sourceStatus: string) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_RECREATE_CLICKED, { order_id: order.id, source: sourceStatus }),

      trackIneligibleToken: (currency: Currency) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_INELIGIBLE_TOKEN, {
          token: currency.symbol,
          chain: NETWORKS_INFO[currency.chainId]?.name,
        }),

      trackExitPriceEntryClicked: ({ currency, source }: { currency: Currency; source: string }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SL_EXIT_PRICE_ENTRY_CLICKED, {
          token: currency.symbol,
          chain: NETWORKS_INFO[currency.chainId]?.name,
          source,
        }),
    }),
    [trackingHandler],
  )
}
