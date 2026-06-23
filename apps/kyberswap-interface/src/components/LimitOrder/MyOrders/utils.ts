import { t } from '@lingui/macro'

import { formatAmountOrder, formatRateLimitOrder, isActiveStatus } from 'components/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'

export const PAGE_SIZE = 10

export const LIST_ORDER_TABS = [LimitOrderStatus.ACTIVE, LimitOrderStatus.CLOSED] as const

type ListOrderTab = (typeof LIST_ORDER_TABS)[number]

type OrderTypeOption = {
  label: string
  value: LimitOrderStatus
}

export const getActiveOrderOptions = (): OrderTypeOption[] => [
  {
    label: t`All Active Orders`,
    value: LimitOrderStatus.ACTIVE,
  },
  {
    label: t`Open Orders`,
    value: LimitOrderStatus.OPEN,
  },
  {
    label: t`Partially Filled Orders`,
    value: LimitOrderStatus.PARTIALLY_FILLED,
  },
]

export const getCloseOrderOptions = (): OrderTypeOption[] => [
  {
    label: t`All Closed Orders`,
    value: LimitOrderStatus.CLOSED,
  },
  {
    label: t`Filled Orders`,
    value: LimitOrderStatus.FILLED,
  },
  {
    label: t`Cancelled Orders`,
    value: LimitOrderStatus.CANCELLED,
  },
  {
    label: t`Expired Orders`,
    value: LimitOrderStatus.EXPIRED,
  },
]

export const getOrderTypeOptions = (orderType: LimitOrderStatus): OrderTypeOption[] =>
  isActiveStatus(orderType) ? getActiveOrderOptions() : getCloseOrderOptions()

export const getActiveTabByOrderType = (orderType: LimitOrderStatus): ListOrderTab =>
  isActiveStatus(orderType) ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED

export const formatStatus = (status: LimitOrderStatus): string => {
  switch (status) {
    case LimitOrderStatus.ACTIVE:
    case LimitOrderStatus.OPEN:
      return t`Active`
    case LimitOrderStatus.PARTIALLY_FILLED:
      return t`Active`
    case LimitOrderStatus.FILLED:
      return t`Filled`
    case LimitOrderStatus.CANCELLING:
      return t`Cancelling`
    case LimitOrderStatus.CANCELLED:
      return t`Cancelled`
    case LimitOrderStatus.EXPIRED:
      return t`Expired`
    case LimitOrderStatus.INSUFFICIENT_FUNDS:
      return t`Insufficient funds`
    default:
      return status.replace('_', ' ')
  }
}

export const getSearchParamsWithKeyword = (searchParams: URLSearchParams, keyword: string): URLSearchParams => {
  const nextSearchParams = new URLSearchParams(searchParams)

  if (keyword) {
    nextSearchParams.set('search', keyword)
  } else {
    nextSearchParams.delete('search')
  }

  return nextSearchParams
}

export const getCancelledOrderTrackingPayload = (order: LimitOrder, chainName: string) => ({
  order_id: order.id,
  side: 'sell',
  from_token: order.makerAssetSymbol,
  to_token: order.takerAssetSymbol,
  pair: `${order.makerAssetSymbol}/${order.takerAssetSymbol}`,
  limit_price: formatRateLimitOrder(order, false),
  amount_in: formatAmountOrder(order.makingAmount, order.makerAssetDecimals),
  time_active_minutes: Math.round((Date.now() / 1000 - order.createdAt) / 60),
  chain: chainName,
})

export const getFilledOrderTrackingPayload = (order: LimitOrder, chainName: string) => {
  const lastTx = order.transactions?.[order.transactions.length - 1]

  return {
    order_id: order.id,
    side: 'sell',
    from_token: order.makerAssetSymbol,
    to_token: order.takerAssetSymbol,
    pair: `${order.makerAssetSymbol}/${order.takerAssetSymbol}`,
    limit_price: formatRateLimitOrder(order, false),
    fill_price: formatRateLimitOrder(order, false),
    amount_in: formatAmountOrder(order.makingAmount, order.makerAssetDecimals),
    amount_out_actual: formatAmountOrder(order.filledTakingAmount, order.takerAssetDecimals),
    tx_hash: lastTx?.txHash,
    chain: chainName,
  }
}
