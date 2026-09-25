import type { Token } from 'services/copyTrading/types/agents'
import type {
  Address,
  CursorPagination,
  CursorResponse,
  DataStatus,
  Metric,
  ResponseMeta,
  SingleResponse,
} from 'services/copyTrading/types/primitives'

export type ApiMetric = Metric

export type ApiValuation = {
  valueUsd?: string
  priceUsd?: string
  priceSource?: string
  priceAsOf?: string
  asOf?: string
  status?: DataStatus
  isEstimated?: boolean
  isFinal?: boolean
}

export type ApiToken = {
  chainId?: string
  address?: string
  symbol?: string
  name?: string
  decimals?: number
  logoUrl?: string
}

export type ApiSingleResponse<T> = {
  data?: T
  meta?: ResponseMeta
}

export type ApiCursorResponse<T> = {
  data?: T[]
  pagination?: Partial<CursorPagination>
  meta?: ResponseMeta
}

export const isValuationRenderable = (valuation?: ApiValuation) =>
  valuation?.status === 'DATA_STATUS_CURRENT' ||
  valuation?.status === 'DATA_STATUS_STALE' ||
  valuation?.isFinal === true

export const metricValue = (metric?: ApiMetric) => {
  const renderable = metric?.status === 'METRIC_STATUS_CURRENT' || metric?.status === 'METRIC_STATUS_STALE'
  return renderable ? metric?.value : undefined
}

export const chainIdNumber = (chainId?: string) => Number(chainId || 0)

export const toToken = (token?: ApiToken): Token => ({
  chainId: chainIdNumber(token?.chainId),
  address: (token?.address || '') as Address,
  symbol: token?.symbol,
  name: token?.name || token?.symbol,
  decimals: token?.decimals,
  iconUrl: token?.logoUrl,
})

export const formatRawAmount = (value: string, decimals?: number) => {
  if (decimals === undefined) return undefined
  if (!/^\d+$/.test(value) || decimals <= 0) return value

  const padded = value.padStart(decimals + 1, '0')
  const integer = padded.slice(0, -decimals)
  const fraction = padded.slice(-decimals).replace(/0+$/, '')
  return fraction ? integer + '.' + fraction : integer
}

const normalizePagination = (pagination?: Partial<CursorPagination>): CursorPagination => ({
  nextCursor: pagination?.nextCursor,
  hasMore: pagination?.hasMore === true,
  limit: pagination?.limit || 25,
})

export const singleResponse = <ApiValue, Value>(
  response: ApiSingleResponse<ApiValue>,
  transform: (value: ApiValue) => Value,
): SingleResponse<Value> => ({
  data: transform(response.data as ApiValue),
  meta: response.meta,
})

export const cursorResponse = <ApiValue, Value>(
  response: ApiCursorResponse<ApiValue>,
  transform: (value: ApiValue) => Value,
): CursorResponse<Value> => ({
  data: (response.data || []).map(transform),
  pagination: normalizePagination(response.pagination),
  meta: response.meta,
})
