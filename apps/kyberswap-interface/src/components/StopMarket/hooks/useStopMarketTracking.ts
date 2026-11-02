import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { useMemo } from 'react'

import { StopMarketExecution } from 'components/Announcement/helpers'
import { OrderKind } from 'components/LimitOrder/types'
import { StopMarket } from 'components/StopMarket/types'
import {
  StopMarketRetryCause,
  getStopMarketServiceErrorMessage,
  getStopMarketTriggerPrice,
} from 'components/StopMarket/utils'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { friendlyError } from 'utils/errorMessage'
import { formatTimeDuration } from 'utils/time'
import { didUserReject } from 'utils/walletError'

/** The pair a form event happened on. `isEdit` marks the edit dialog's copy of the form. */
type PairContext = {
  currencyIn?: Currency
  currencyOut?: Currency
  chainId: number
  isEdit?: boolean
}

type OrderContext = PairContext & {
  inputAmount: string
  /** Sell amount valued at the sell token's USD price, when that price is known. */
  amountUsd?: number
  triggerPrice: string
  /** Signed distance from the oracle price in percent, negative below it. */
  triggerPercent?: number
  /** Basis points. */
  slippage: number
  expiredAt: number
  /** Set when the order is an edit: it replaces this one, which the placed-order count must not double. */
  replacesOrderId?: number
}

/** How the trigger price came to be what it is. */
export type TriggerInputMethod = 'typed' | 'preset' | 'custom_percent' | 'oracle' | 'amount_out'

/** The two status tabs of the order list. */
export type OrderListStatus = 'active' | 'history'

/** Rides on the approval transaction into the `Token Approval Completed` event. */
export const STOP_MARKET_APPROVAL_TRACKING_PAYLOAD = { source: 'stop_market' }

const ORDER_LIST_CLICK_EVENTS: Record<OrderListStatus, Record<OrderKind, TRACKING_EVENT_TYPE>> = {
  active: {
    [OrderKind.LIMIT]: TRACKING_EVENT_TYPE.SM_ORDER_LIST_ACTIVE_LIMIT_CLICK,
    [OrderKind.STOP]: TRACKING_EVENT_TYPE.SM_ORDER_LIST_ACTIVE_STOP_CLICK,
  },
  history: {
    [OrderKind.LIMIT]: TRACKING_EVENT_TYPE.SM_ORDER_LIST_HISTORY_LIMIT_CLICK,
    [OrderKind.STOP]: TRACKING_EVENT_TYPE.SM_ORDER_LIST_HISTORY_STOP_CLICK,
  },
}

const getChainName = (chainId: number) => NETWORKS_INFO[chainId as ChainId]?.name

const pairOf = (currencyIn?: Currency, currencyOut?: Currency) =>
  `${currencyIn?.symbol ?? ''}/${currencyOut?.symbol ?? ''}`

const getTokenAddress = (currency?: Currency) => (currency?.isNative ? 'NATIVE' : currency?.wrapped.address)

/** The trigger's distance under the oracle price as a positive figure; `triggerPercent` itself is negative there. */
const getPctBelow = (percent?: number) => (percent === undefined ? undefined : percent === 0 ? 0 : -percent)

/** Expiry as the form shows it: a duration for a preset, a date for a custom one. */
const formatExpiry = (value: Date | number) =>
  value instanceof Date ? dayjs(value).format('DD/MM/YYYY HH:mm') : formatTimeDuration(value)

const getErrorMessage = (error: unknown) =>
  getStopMarketServiceErrorMessage(error) ??
  (error instanceof Error || typeof error === 'string' ? friendlyError(error) : undefined)

const getPairPayload = ({ currencyIn, currencyOut, chainId, isEdit }: PairContext) => ({
  pair: pairOf(currencyIn, currencyOut),
  from_token: currencyIn?.symbol,
  to_token: currencyOut?.symbol,
  chain: getChainName(chainId),
  is_edit: !!isEdit,
})

const getOrderContextPayload = (context: OrderContext) => ({
  ...getPairPayload(context),
  amount: context.inputAmount,
  amount_usd: context.amountUsd,
  trigger_price: context.triggerPrice,
  trigger_pct_below: getPctBelow(context.triggerPercent),
  slippage: context.slippage,
  expiry: context.expiredAt,
  is_edit: context.isEdit || context.replacesOrderId !== undefined,
  replaces_order_id: context.replacesOrderId,
})

const getOrderPayload = (order: StopMarket) => ({
  order_id: order.id,
  chain: getChainName(order.chainId),
  pair: `${order.tokenInInfo.symbol}/${order.tokenOutInfo.symbol}`,
  trigger_price: getStopMarketTriggerPrice(order),
  order_age_hours: Math.round((Date.now() / 1000 - order.createdAt) / 3600),
})

const getApprovalPayload = ({ currency, spender, chainId }: ApprovalContext) => ({
  token_symbol: currency?.symbol,
  token_address: getTokenAddress(currency),
  spender_address: spender,
  chain: getChainName(chainId),
  ...STOP_MARKET_APPROVAL_TRACKING_PAYLOAD,
})

type ApprovalContext = { currency?: Currency; spender?: string; chainId: number }

/** Feeds the funnel the tracking spec defines: form → review → signed, and the order list after. */
export const useStopMarketTracking = () => {
  const { trackingHandler } = useTracking()

  return useMemo(
    () => ({
      trackTokenSelected: (currency: Currency, position: 'sell' | 'receive', pairedCurrency?: Currency) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_TOKEN_SELECTED, {
          token: currency.symbol,
          token_address: getTokenAddress(currency),
          token_position: position,
          paired_token: pairedCurrency?.symbol,
          chain: getChainName(currency.chainId),
        }),

      trackTriggerPriceSet: ({
        triggerPrice,
        marketPrice,
        triggerPercent,
        inputMethod,
        ...context
      }: PairContext & {
        triggerPrice: string
        marketPrice?: number
        triggerPercent?: number
        inputMethod: TriggerInputMethod
      }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_TRIGGER_PRICE_SET, {
          ...getPairPayload(context),
          trigger_price: triggerPrice,
          market_price: marketPrice,
          trigger_pct_below: getPctBelow(triggerPercent),
          input_method: inputMethod,
        }),

      /** `previous` and `next` are basis points; reported in percent, as the Swap event is. */
      trackSlippageChanged: ({ previous, next, ...context }: PairContext & { previous: number; next: number }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_SLIPPAGE_CHANGED, {
          ...getPairPayload(context),
          previous_slippage: previous / 100,
          new_slippage: next / 100,
        }),

      trackExpiryChanged: ({
        previousExpiry,
        next,
        ...context
      }: PairContext & { previousExpiry: string; next: Date | number }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_EXPIRY_CHANGED, {
          ...getPairPayload(context),
          previous_expiry: previousExpiry,
          new_expiry: formatExpiry(next),
          is_custom_date: next instanceof Date,
        }),

      trackTokenPairReversed: (context: PairContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_TOKEN_PAIR_REVERSED, {
          ...getPairPayload(context),
          new_from_token: context.currencyOut?.symbol,
          new_to_token: context.currencyIn?.symbol,
        }),

      trackPairInvertClick: ({ direction, ...context }: PairContext & { direction: 'native' | 'inverted' }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_CLICK_PAIR_INVERT, { ...getPairPayload(context), direction }),

      trackAmountEntered: ({ amount, amountUsd, ...context }: PairContext & { amount: string; amountUsd?: number }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_AMOUNT_ENTERED, {
          ...getPairPayload(context),
          amount,
          amount_usd: amountUsd,
        }),

      trackRatePresetClick: ({ preset, ...context }: PairContext & { preset: number }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_CLICK_RATE_PRESET, { ...getPairPayload(context), preset }),

      trackPlaceOrderClick: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_PLACE_ORDER_CLICK, getOrderContextPayload(context)),

      trackReviewOpened: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_REVIEW_OPENED, getOrderContextPayload(context)),

      trackConsentAccepted: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_CONSENT_ACCEPTED, getOrderContextPayload(context)),

      trackConfirmOrderClick: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_CONFIRM_ORDER_CLICK, getOrderContextPayload(context)),

      trackApprovalInitiated: (context: ApprovalContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.TOKEN_APPROVAL_INITIATED, {
          ...getApprovalPayload(context),
          approval_type: 'approve',
          // Approved without an amount, which grants an unlimited allowance.
          approval_amount: 'unlimited',
        }),

      trackApprovalFailed: ({
        status,
        errorMessage,
        ...context
      }: ApprovalContext & { status: string; errorMessage?: string }) =>
        trackingHandler(TRACKING_EVENT_TYPE.TOKEN_APPROVAL_FAILED, {
          ...getApprovalPayload(context),
          error_type: status,
          error_message: errorMessage,
        }),

      trackSignatureRequested: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_SIGNATURE_REQUESTED, getOrderContextPayload(context)),

      trackOrderPlaced: (context: OrderContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_ORDER_PLACED, {
          ...getOrderContextPayload(context),
          order_type: 'stop_market',
        }),

      trackOrderFailed: (context: OrderContext, error: unknown) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_ORDER_FAILED, {
          ...getOrderContextPayload(context),
          error_type: didUserReject(error) ? 'user_rejected' : 'failed',
          error_message: getErrorMessage(error),
        }),

      trackViewOrderClick: (context: PairContext) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_VIEW_ORDER_CLICK, getPairPayload(context)),

      /** A status tab or a kind tab was clicked; named after the list the click lands on. */
      trackOrderListClick: ({
        status,
        kind,
        source,
      }: {
        status: OrderListStatus
        kind: OrderKind
        source: 'status_tab' | 'kind_tab'
      }) => trackingHandler(ORDER_LIST_CLICK_EVENTS[status][kind], { source }),

      trackEditOrderClick: (order: StopMarket, source: 'row' | 'retry') =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_EDIT_ORDER_CLICK, { ...getOrderPayload(order), source }),

      trackCancelOrderClick: (order: StopMarket) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_CANCEL_ORDER_CLICK, getOrderPayload(order)),

      trackCancelAllClick: ({ orderType, count }: { orderType: 'stop_market' | 'limit_order'; count: number }) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_CANCEL_ALL_CLICK, { order_type: orderType, order_count: count }),

      trackRecreateClicked: (order: StopMarket, sourceStatus: string) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_RECREATE_CLICKED, { order_id: order.id, source: sourceStatus }),

      /** An execution the notification service reported; only the fields it filled in are known. */
      trackOrderExecuted: (execution: StopMarketExecution | undefined, notificationId: number) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_ORDER_EXECUTED, {
          notification_id: notificationId,
          chain: execution?.chainId === undefined ? undefined : getChainName(execution.chainId),
          pair:
            execution?.tokenInSymbol && execution.tokenOutSymbol
              ? `${execution.tokenInSymbol}/${execution.tokenOutSymbol}`
              : undefined,
          amount: execution?.amountIn,
          amount_out: execution?.amountOut,
          trigger_price: execution?.triggerPrice,
          executed_price: execution?.executedPrice,
          tx_hash: execution?.txHash,
        }),

      trackOrderRetrying: (order: StopMarket, cause: StopMarketRetryCause) =>
        trackingHandler(TRACKING_EVENT_TYPE.SM_ORDER_RETRYING, { ...getOrderPayload(order), cause }),
    }),
    [trackingHandler],
  )
}
