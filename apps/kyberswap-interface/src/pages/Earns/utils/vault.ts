import {
  VaultApiDetailItem,
  VaultApiListItem,
  VaultApiMetricPoint,
  VaultApiMetrics,
  VaultPendingWithdrawalSummary,
  VaultPositionItem,
} from 'services/vault'

import { ChartDataPoint, UserVaultPosition, VaultInfo, WithdrawalStatus } from 'pages/Earns/ExploreVaults/types'

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

const mapWithdrawalStatus = (pending?: VaultPendingWithdrawalSummary): WithdrawalStatus => {
  if (!pending) return WithdrawalStatus.NONE
  const status = (pending.latestStatus || '').toLowerCase()
  if (status === 'completed' || status === 'ready' || status === 'claimable') return WithdrawalStatus.COMPLETED
  if (status === 'requested' || status === 'queued') return WithdrawalStatus.REQUESTED
  return WithdrawalStatus.PENDING
}

const computeProcessingSeconds = (etaExpectedAt?: string): number => {
  if (!etaExpectedAt) return -1
  const eta = new Date(etaExpectedAt).getTime()
  if (Number.isNaN(eta)) return -1
  const diff = Math.floor((eta - Date.now()) / 1000)
  return diff > 0 ? diff : 0
}

export const toUserVaultPosition = (item: VaultPositionItem): UserVaultPosition => {
  const v = item.vault
  const balance = Number(item.underlyingEquivalent) || 0
  const balanceUsd = Number(item.usdValue) || 0
  const earnedUsd = Number(item.earnedUsd) || 0
  const pricePerToken = balance > 0 ? balanceUsd / balance : 0
  const earned = pricePerToken > 0 ? earnedUsd / pricePerToken : 0
  const pending = item.pendingWithdrawalSummary

  return {
    id: v.id,
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
    processingTimeSeconds: computeProcessingSeconds(pending?.etaExpectedAt),
    withdrawalStatus: mapWithdrawalStatus(pending),
  }
}
