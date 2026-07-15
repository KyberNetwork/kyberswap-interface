import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import dayjs from 'dayjs'

import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { isActiveStatus } from 'components/LimitOrder/utils'
import { NativeCurrencies } from 'constants/tokens'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

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

export const getOrdersApiSearchKeyword = (keyword: string, chainIds: ChainId[]): string => {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) return keyword

  const matchedChainId = chainIds.find(chainId => NativeCurrencies[chainId].symbol?.toLowerCase() === normalizedKeyword)
  return matchedChainId ? NativeCurrencies[matchedChainId].wrapped.symbol || keyword : keyword
}

export const formatOrderDisplayAmount = (amount: string, decimals: number): string =>
  formatDisplayNumber(uint256ToFraction(amount, decimals).toFixed(18), { significantDigits: 6 })

export const formatOrderTime = (timestamp: number): string => dayjs(timestamp * 1000).format('DD/MM/YYYY HH:mm')

export const getOrderRate = (order: LimitOrder): string => {
  const rate = uint256ToFraction(order.takingAmount, order.takerAssetDecimals).divide(
    uint256ToFraction(order.makingAmount, order.makerAssetDecimals),
  )
  return rate.toFixed(18)
}

export const getNeededMakingAmount = (order: LimitOrder, makingToken: Token): CurrencyAmount<Currency> => {
  const makingAmount = toCurrencyAmount(makingToken, order.makingAmount)
  const filledMakingAmount = toCurrencyAmount(makingToken, order.filledMakingAmount)

  return makingAmount.subtract(filledMakingAmount)
}

export const getFilledProgressPercent = (filledPercent: string): number =>
  filledPercent.startsWith('<') ? 0.01 : Number(filledPercent.replace(/,/g, '')) || 0
