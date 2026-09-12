import {
  VaultApiDetailItem,
  VaultApiListItem,
  VaultApiMetricPoint,
  VaultApiMetrics,
  VaultPositionItem,
  VaultWithdrawRequest,
  VaultWithdrawRequestStatus,
} from 'services/vault'

import { APP_PATHS } from 'constants/index'
import { ChartDataPoint, UserVaultPosition, VaultInfo } from 'pages/Earns/ExploreVaults/types'

const toChartDataPoints = (points?: VaultApiMetricPoint[]): ChartDataPoint[] =>
  (points || []).map(p => ({ value: Number(p.value) || 0 }))

const latestValue = (points?: VaultApiMetricPoint[]): number => {
  if (!points?.length) return 0
  const last = points[points.length - 1]
  return Number(last.value) || 0
}

export const toVaultInfo = (item: VaultApiListItem): VaultInfo => ({
  id: item.vaultId,
  token: item.underlyingToken?.symbol || '',
  tokenIcon: item.underlyingToken?.logo || '',
  chainId: item.chain?.id || 0,
  chainIcon: item.chain?.logo || '',
  chainName: item.chain?.name || '',
  label: item.name || '',
  partner: item.provider?.name || '',
  partnerLogo: item.provider?.logo || '',
  apy: latestValue(item.metrics?.apy),
  tvl: latestValue(item.metrics?.tvl),
  apyHistory: toChartDataPoints(item.metrics?.apy),
  tvlHistory: toChartDataPoints(item.metrics?.tvl),
})

export const toVaultInfoFromDetail = (detail: VaultApiDetailItem, metrics?: VaultApiMetrics): VaultInfo => ({
  id: detail.vaultId,
  token: detail.underlyingToken?.symbol || '',
  tokenIcon: detail.underlyingToken?.logo || '',
  chainId: detail.chain?.id || 0,
  chainIcon: detail.chain?.logo || '',
  chainName: detail.chain?.name || '',
  label: detail.name || '',
  partner: detail.provider?.name || '',
  partnerLogo: detail.provider?.logo || '',
  apy: detail.stats?.apy7d ?? 0,
  tvl: detail.stats?.tvlUsd ?? 0,
  apyHistory: toChartDataPoints(metrics?.apy),
  tvlHistory: toChartDataPoints(metrics?.tvl),
})

export const toUserVaultPosition = (item: VaultPositionItem): UserVaultPosition => {
  const v = item.vault
  const balance = Number(item.underlyingEquivalent) || 0
  const balanceUsd = Number(item.usdValue) || 0
  const earnedUsd = Number(item.earnedUsd) || 0
  const pricePerToken = balance > 0 ? balanceUsd / balance : 0
  const earned = pricePerToken > 0 ? earnedUsd / pricePerToken : 0
  return {
    id: v.id,
    vaultId: v.id,
    shareBalanceRaw: item.shareBalanceRaw || '0',
    shareDecimals: v.shareToken?.decimals ?? 18,
    shareSymbol: v.shareToken?.symbol || '',
    token: v.underlyingToken?.symbol || '',
    tokenIcon: v.underlyingToken?.logo || '',
    chainId: item.chain?.id || 0,
    chainIcon: item.chain?.logo || '',
    chainName: item.chain?.name || '',
    label: v.name || '',
    partner: v.provider?.name || '',
    partnerLogo: v.provider?.logo || '',
    apy: v.stats?.apy7d ?? 0,
    tvl: v.stats?.tvlUsd ?? 0,
    apyHistory: [],
    tvlHistory: [],
    balance,
    balanceUsd,
    earned,
    earnedUsd,
    withdrawRequests: getOpenWithdrawRequests(item.withdrawRequests),
  }
}

/** API amounts arrive as strings and an incomplete record would otherwise throw mid-render, taking
 *  the whole page down with it — there is a single error boundary around the routed body. */
export const safeBigInt = (value: string | number | null | undefined, fallback = 0n): bigint => {
  if (value === null || value === undefined || value === '') return fallback
  try {
    return BigInt(value)
  } catch {
    return fallback
  }
}

/** Requests the queue is still holding shares for — the only ones the user can act on. */
export const isOpenWithdrawRequest = (request: VaultWithdrawRequest) =>
  request.status === VaultWithdrawRequestStatus.PENDING ||
  request.status === VaultWithdrawRequestStatus.MATURED ||
  request.status === VaultWithdrawRequestStatus.EXPIRED

/** Oldest first: the request the user has been waiting on longest is the one to show and act on. */
export const getOpenWithdrawRequests = (requests?: VaultWithdrawRequest[]) =>
  (requests || []).filter(isOpenWithdrawRequest).sort((a, b) => a.creationTime - b.creationTime)

export const getWithdrawRequestMaturityAt = (request: VaultWithdrawRequest) =>
  request.creationTime + request.secondsToMaturity

export const getWithdrawRequestExpiryAt = (request: VaultWithdrawRequest) =>
  request.creationTime + request.secondsToMaturity + request.secondsToDeadline

export type VaultDetailTab = 'deposit' | 'withdraw'

export const buildVaultDetailPath = (chainId: number, vaultId: string, tab?: VaultDetailTab) => {
  const path = APP_PATHS.EARN_VAULT_DETAIL.replace(':chainId', String(chainId)).replace(':vaultId', vaultId)
  return tab ? `${path}?tab=${tab}` : path
}
