import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { StopMarket } from 'components/StopMarket/types'
import { getStopMarketTriggerPrice } from 'components/StopMarket/utils'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'

type OrderContext = {
  currencyIn?: Currency
  currencyOut?: Currency
  chainId: number
  inputAmount: string
  /** Sell amount valued at the sell token's USD price, when that price is known. */
  amountUsd?: number
  triggerPrice: string
  triggerPercent?: number
  slippage: number
  expiredAt: number
  /** Set when the order is an edit: it replaces this one, which the placed-order count must not double. */
  replacesOrderId?: number
}

const pairOf = (currencyIn?: Currency, currencyOut?: Currency) =>
  `${currencyIn?.symbol ?? ''}/${currencyOut?.symbol ?? ''}`

/** Feeds the funnel described in the spec: entry point → review → placed, split by source. */
export const useStopMarketTracking = () => {
  const { trackingHandler } = useTracking()

  return useMemo(
    () => ({
      trackPageViewed: (chainId: number, source: string) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_PAGE_VIEWED, { chain: NETWORKS_INFO[chainId as ChainId]?.name, source }),

      trackTokenSelected: (currency: Currency) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_TOKEN_SELECTED, {
          token: currency.symbol,
          chain: NETWORKS_INFO[currency.chainId]?.name,
        }),

      trackReviewOpened: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_REVIEW_OPENED, {
          pair: pairOf(context.currencyIn, context.currencyOut),
          amount: context.inputAmount,
          amount_usd: context.amountUsd,
          trigger_pct_below: context.triggerPercent,
          is_edit: context.replacesOrderId !== undefined,
          replaces_order_id: context.replacesOrderId,
        }),

      trackOrderPlaced: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_ORDER_PLACED, {
          pair: pairOf(context.currencyIn, context.currencyOut),
          chain: NETWORKS_INFO[context.chainId as ChainId]?.name,
          amount: context.inputAmount,
          amount_usd: context.amountUsd,
          trigger_price: context.triggerPrice,
          trigger_pct_below: context.triggerPercent,
          slippage: context.slippage,
          expiry: context.expiredAt,
          order_type: 'stop_market',
          is_edit: context.replacesOrderId !== undefined,
          replaces_order_id: context.replacesOrderId,
        }),

      trackOrderCancelled: (order: StopMarket) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_ORDER_CANCELLED, {
          order_id: order.id,
          chain: NETWORKS_INFO[order.chainId]?.name,
          trigger_price: getStopMarketTriggerPrice(order),
          order_age_hours: Math.round((Date.now() / 1000 - order.createdAt) / 3600),
        }),

      trackRecreateClicked: (order: StopMarket, sourceStatus: string) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_RECREATE_CLICKED, { order_id: order.id, source: sourceStatus }),

      trackIneligibleToken: (currency: Currency) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_INELIGIBLE_TOKEN, {
          token: currency.symbol,
          chain: NETWORKS_INFO[currency.chainId]?.name,
        }),

      trackExitPriceEntryClicked: ({ currency, source }: { currency: Currency; source: string }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_EXIT_PRICE_ENTRY_CLICKED, {
          token: currency.symbol,
          chain: NETWORKS_INFO[currency.chainId]?.name,
          source,
        }),
    }),
    [trackingHandler],
  )
}
