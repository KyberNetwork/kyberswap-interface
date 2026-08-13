import type { Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import {
  CancelOrderType,
  type LimitOrder,
  type LimitOrderCreateContext,
  type LimitOrderFromTokenPairFormatted,
  type LimitOrderTakeContext,
} from 'components/LimitOrder/types'
import {
  formatAmountOrder,
  formatPriceInputValue,
  formatRateLimitOrder,
  getErrorMessage,
} from 'components/LimitOrder/utils'
import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'

type CreateOrderEstimateUSD = {
  rawInput?: number
}

type OrderBookClickTakeParams = {
  order: LimitOrderFromTokenPairFormatted
  makerCurrency?: Currency
  takerCurrency?: Currency
}

type OrderBookClickPairInvertParams = {
  makerCurrency?: Currency
  takerCurrency?: Currency
  direction: 'native' | 'inverted'
}

type TakeOrderClickFillParams = {
  context: LimitOrderTakeContext
  fillAmount: string
}

type TakeOrderClickUseSwapParams = {
  context: LimitOrderTakeContext
  marketDiffPercent: number
}

type TakeOrderClickRetryParams = {
  context: LimitOrderTakeContext
  step: string
}

type TakeOrderClosePanelParams = {
  context: LimitOrderTakeContext
  stage: 'browsing' | 'processing' | 'success'
}

type FormMarketPriceSetParams = {
  currencyIn?: Currency
  currencyOut?: Currency
  limitPrice: string
  chain: string
}

type FormSideSelectedParams = {
  currencyIn?: Currency
  currencyOut?: Currency
  chain: string
}

type FormExpiryChangedParams = {
  previousExpiry: string
  newExpiry: string
  customExpiryMinutes: number | null
  chain: string
}

type CancelTypeClickParams = {
  order: LimitOrder
  networkName: string
  cancelType: CancelOrderType
}

type CreateOrderTrackingParams = {
  order: LimitOrderCreateContext
  estimateUSD: CreateOrderEstimateUSD
}

type CreateOrderSuccessTrackingParams = CreateOrderTrackingParams & {
  orderId: number
}

type CreateOrderTipLinkTrackingParams = CreateOrderSuccessTrackingParams & {
  searchParams: URLSearchParams
}

const getTokenAddress = (currency: Currency | undefined) => (currency?.isNative ? 'NATIVE' : currency?.wrapped?.address)

const getPriceDifferencePct = (rawPercent: number | undefined) =>
  rawPercent !== undefined && Number.isFinite(rawPercent) ? Number(rawPercent) : undefined

const getCreateOrderPair = (order: LimitOrderCreateContext) => {
  const { currencyIn, currencyOut } = order
  return currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined
}

const getPair = (currencyIn: Currency | undefined, currencyOut: Currency | undefined) =>
  currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined

const getOrderBookOrderPair = (
  order: LimitOrderFromTokenPairFormatted,
  makerCurrency: Currency | undefined,
  takerCurrency: Currency | undefined,
) => {
  const fromCurrency = order.isReversed ? takerCurrency : makerCurrency
  const toCurrency = order.isReversed ? makerCurrency : takerCurrency

  return getPair(fromCurrency, toCurrency)
}

const getTakeOrderPair = (context: LimitOrderTakeContext) =>
  `${context.payCurrency.symbol}/${context.receiveCurrency.symbol}`

const getTakeOrderChain = (context: LimitOrderTakeContext) => NETWORKS_INFO[context.order.chainId]?.name

const getRetryStep = (step: string) => (step === 'fill' ? 'confirm' : step)

const getCreateOrderMarketPrice = (order: LimitOrderCreateContext) =>
  order.tradeInfo ? formatPriceInputValue(order.tradeInfo.marketRate) : undefined

const getCreateOrderBasePayload = (order: LimitOrderCreateContext) => ({
  side: 'sell',
  from_token: order.currencyIn?.symbol,
  from_token_address: getTokenAddress(order.currencyIn),
  to_token: order.currencyOut?.symbol,
  to_token_address: getTokenAddress(order.currencyOut),
  pair: getCreateOrderPair(order),
  limit_price: order.displayRate,
  market_price: getCreateOrderMarketPrice(order),
  price_difference_pct: getPriceDifferencePct(order.deltaRate.rawPercent),
  amount: order.inputAmount,
  amount_in: order.inputAmount,
  chain: order.networkName,
})

const getCreatePlaceOrderPayload = (order: LimitOrderCreateContext, payload: Record<string, unknown> = {}) => ({
  from_token: order.currencyIn?.symbol,
  to_token: order.currencyOut?.symbol,
  from_network: order.networkName,
  trade_qty: order.inputAmount,
  ...payload,
})

const getCreateReviewPayload = (order: LimitOrderCreateContext, estimateUSD: CreateOrderEstimateUSD) => ({
  ...getCreateOrderBasePayload(order),
  amount_in_usd: estimateUSD.rawInput || undefined,
  amount_out_estimated: order.outputAmount,
  expiry: order.displayTime,
})

const getOrderLifecycleBasePayload = (order: LimitOrder, chainName: string) => ({
  order_id: order.id,
  side: 'sell',
  from_token: order.makerAssetSymbol,
  to_token: order.takerAssetSymbol,
  pair: `${order.makerAssetSymbol}/${order.takerAssetSymbol}`,
  limit_price: formatRateLimitOrder(order, false),
  amount_in: formatAmountOrder(order.makingAmount, order.makerAssetDecimals),
  chain: chainName,
})

export const getOrderTrackingPayload = (
  order: LimitOrder,
  networkName: string,
  payload: Record<string, unknown> = {},
) => {
  const amountIn = formatAmountOrder(order.makingAmount, order.makerAssetDecimals)

  return {
    ...payload,
    ...getOrderLifecycleBasePayload(order, networkName),
    from_network: networkName,
    trade_qty: amountIn,
  }
}

export const getCancelAllOrdersSubmittedTrackingPayload = (orders: LimitOrder[], contractAddress: string) => ({
  totalOrder: orders.length,
  orderIds: orders
    .filter(order => order.contractAddress.toLowerCase() === contractAddress.toLowerCase())
    .map(order => order.id),
})

export const useLimitOrderTracking = () => {
  const { trackingHandler } = useTracking()

  return useMemo(
    () => ({
      trackCancelTypeClick: ({ order, networkName, cancelType }: CancelTypeClickParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_TYPE, {
          ...getOrderTrackingPayload(order, networkName),
          cancel_type: cancelType === CancelOrderType.GAS_LESS_CANCEL ? 'Gasless' : 'Hard',
        })
      },
      trackCreateMarketRateClick: (order: LimitOrderCreateContext) => {
        const pair = getCreateOrderPair(order)
        if (!pair) return

        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_MARKET_RATE, { pair })
      },
      trackCreateOrderFailed: (order: LimitOrderCreateContext, error: unknown) => {
        const errorMessage = getErrorMessage(error)
        const isUserRejected =
          errorMessage.toLowerCase().includes('user denied') || errorMessage.toLowerCase().includes('user rejected')

        trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_FAILED, {
          ...getCreateOrderBasePayload(order),
          error_type: isUserRejected ? 'user_rejected' : 'tx_failed',
          error_message: errorMessage,
        })
      },
      trackCreateOrderPlaced: ({ order, estimateUSD, orderId }: CreateOrderSuccessTrackingParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_PLACED, {
          ...getCreateReviewPayload(order, estimateUSD),
          order_id: orderId,
          volume: estimateUSD.rawInput || undefined,
        })
      },
      trackCreatePlaceOrderClick: (order: LimitOrderCreateContext) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_PLACE_ORDER, getCreatePlaceOrderPayload(order))
      },
      trackCreatePlaceOrderSubmitSuccess: (order: LimitOrderCreateContext, orderId: number) => {
        trackingHandler(
          TRACKING_EVENT_TYPE.LO_PLACE_ORDER_SUCCESS,
          getCreatePlaceOrderPayload(order, { order_id: orderId }),
        )
      },
      trackCreatePriceSetOnBlur: (order: LimitOrderCreateContext) => {
        if (!order.displayRate || !order.currencyIn || !order.currencyOut) return

        trackingHandler(TRACKING_EVENT_TYPE.LO_PRICE_SET, {
          side: 'sell',
          limit_price: order.displayRate,
          market_price: getCreateOrderMarketPrice(order),
          price_difference_pct: getPriceDifferencePct(order.deltaRate.rawPercent),
          from_token: order.currencyIn.symbol,
          to_token: order.currencyOut.symbol,
          chain: order.networkName,
        })
      },
      trackCreateRatePresetClick: (order: LimitOrderCreateContext, preset: string) => {
        const pair = getCreateOrderPair(order)
        if (!pair) return

        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_RATE_PRESET, { pair, preset })
      },
      trackCreateReviewOpened: ({ order, estimateUSD }: CreateOrderTrackingParams) => {
        if (!order.currencyIn || !order.currencyOut || !order.displayRate) return

        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_REVIEW_PLACE_ORDER, {
          from_token: order.currencyIn.symbol,
          to_token: order.currencyOut.symbol,
          from_network: order.chainId,
          trade_qty: order.inputAmount,
        })
        trackingHandler(TRACKING_EVENT_TYPE.LO_REVIEW_OPENED, getCreateReviewPayload(order, estimateUSD))
      },
      trackCreateSharedBalanceReview: (order: LimitOrderCreateContext) => {
        const pair = getCreateOrderPair(order)
        if (!pair) return

        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_SHARED_BALANCE_REVIEW, { pair })
      },
      trackCreateTipLinkTrade: ({ order, estimateUSD, orderId, searchParams }: CreateOrderTipLinkTrackingParams) => {
        const tipLink = getTipLinkAttribution(searchParams)
        if (!tipLink) return

        trackingHandler(TRACKING_EVENT_TYPE.TIP_LINK_TRADE, {
          trade_type: 'limit_order',
          trade_status: 'placed',
          tip_charged: false,
          ...tipLink,
          input_token: order.currencyIn?.symbol,
          output_token: order.currencyOut?.symbol,
          input_token_address: getTokenAddress(order.currencyIn),
          output_token_address: getTokenAddress(order.currencyOut),
          pair: getCreateOrderPair(order),
          chain: order.networkName,
          chain_id: order.chainId,
          volume: estimateUSD.rawInput || undefined,
          order_id: orderId,
        })
      },
      trackCreateTouchInput: () => trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter amount box'),
      trackCreateTouchSelectToken: () => trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'touch enter token box'),
      trackFormChooseDate: () => trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'choose date'),
      trackFormExpiryChanged: ({ previousExpiry, newExpiry, customExpiryMinutes, chain }: FormExpiryChangedParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_EXPIRY_CHANGED, {
          previous_expiry: previousExpiry,
          new_expiry: newExpiry,
          custom_expiry_minutes: customExpiryMinutes,
          chain,
        })
      },
      trackFormMarketPriceSet: ({ currencyIn, currencyOut, limitPrice, chain }: FormMarketPriceSetParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_PRICE_SET, {
          side: 'sell',
          limit_price: limitPrice,
          market_price: limitPrice,
          price_difference_pct: 0,
          from_token: currencyIn?.symbol,
          to_token: currencyOut?.symbol,
          chain,
        })
      },
      trackFormSetPriceClick: () => trackingHandler(TRACKING_EVENT_TYPE.LO_ENTER_DETAIL, 'set price'),
      trackFormSideSelected: ({ currencyIn, currencyOut, chain }: FormSideSelectedParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_SIDE_SELECTED, {
          side: 'buy',
          from_token: currencyOut?.symbol,
          to_token: currencyIn?.symbol,
          chain,
        })
      },
      trackMyOrderCancelClick: (order: LimitOrder, networkName: string) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_ORDER, getOrderTrackingPayload(order, networkName))
      },
      trackMyOrderCancelled: (order: LimitOrder, networkName: string) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_CANCELLED, {
          ...getOrderLifecycleBasePayload(order, networkName),
          time_active_minutes: Math.round((Date.now() / 1000 - order.createdAt) / 60),
        })
      },
      trackMyOrderFilled: (order: LimitOrder, networkName: string) => {
        const lastTx = order.transactions?.[order.transactions.length - 1]

        trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_FILLED, {
          ...getOrderLifecycleBasePayload(order, networkName),
          fill_price: formatRateLimitOrder(order, false),
          amount_out_actual: formatAmountOrder(order.filledTakingAmount, order.takerAssetDecimals),
          tx_hash: lastTx?.txHash,
        })
      },
      trackOrderBookClickPairInvert: ({ makerCurrency, takerCurrency, direction }: OrderBookClickPairInvertParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_PAIR_INVERT, {
          pair: getPair(makerCurrency, takerCurrency),
          direction,
        })
      },
      trackOrderBookClickTake: ({ order, makerCurrency, takerCurrency }: OrderBookClickTakeParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_TAKE, {
          order_id: order.id,
          pair: getOrderBookOrderPair(order, makerCurrency, takerCurrency),
          chain: NETWORKS_INFO[order.chainId]?.name,
        })
      },
      trackTakeClickFill: ({ context, fillAmount }: TakeOrderClickFillParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_FILL, {
          order_id: context.order.id,
          pair: getTakeOrderPair(context),
          chain: getTakeOrderChain(context),
          fill_amount: fillAmount,
        })
      },
      trackTakeClickHalf: (context: LimitOrderTakeContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_HALF, { order_id: context.order.id }),
      trackTakeClickMax: (context: LimitOrderTakeContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_MAX, { order_id: context.order.id }),
      trackTakeClickRetry: ({ context, step }: TakeOrderClickRetryParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_RETRY, { order_id: context.order.id, step: getRetryStep(step) })
      },
      trackTakeClickUseSwap: ({ context, marketDiffPercent }: TakeOrderClickUseSwapParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_USE_SWAP, {
          order_id: context.order.id,
          pair: getTakeOrderPair(context),
          diff_pct: marketDiffPercent,
        })
      },
      trackTakeClickWalletMax: (context: LimitOrderTakeContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLICK_WALLET_MAX, { order_id: context.order.id }),
      trackTakeClosePanel: ({ context, stage }: TakeOrderClosePanelParams) => {
        trackingHandler(TRACKING_EVENT_TYPE.LO2_CLOSE_PANEL, { order_id: context.order.id, stage })
      },
    }),
    [trackingHandler],
  )
}
