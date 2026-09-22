import {
  VAULT_FINANCIAL_NUMERIC_STATUSES,
  VaultApiDetailItem,
  VaultApiListItem,
  VaultApiMetrics,
  VaultCanonicalPoint,
  VaultFinancialValue,
  VaultGrowthHistory,
  VaultGrowthPoint,
  VaultPositionItem,
  VaultQueueFamily,
  VaultSupportedAsset,
  VaultWithdrawRequest,
  VaultWithdrawRequestStatus,
  VaultWithdrawalRoute,
} from 'services/vault'

import { APP_PATHS } from 'constants/index'
import { ChartDataPoint, UserVaultPosition, VaultInfo } from 'pages/Earns/ExploreVaults/types'

/**
 * A figure counts only when its status says the API stands behind it. Every other status — waiting
 * on a projector, missing an input, or one this build does not recognise — means there is no number,
 * which is not the same as zero.
 */
export const financialNumber = (financial?: VaultFinancialValue | null): number | undefined => {
  if (!financial || financial.value === null || financial.value === '') return undefined
  if (!VAULT_FINANCIAL_NUMERIC_STATUSES.includes(financial.status)) return undefined
  const parsed = Number(financial.value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Unavailable buckets keep their slot so the chart shows a gap rather than a dip to zero. */
const toChartPoints = (
  points: VaultCanonicalPoint[] | undefined,
  pick: (point: VaultCanonicalPoint) => VaultFinancialValue,
): ChartDataPoint[] =>
  (points || []).map(point => ({
    value: financialNumber(pick(point)) ?? null,
    timestamp: point.timestamp ?? undefined,
  }))

/** Chart series from a metrics response, keeping unavailable buckets as gaps. */
export const toChartSeries = (
  metrics: VaultApiMetrics | undefined,
  pick: (point: VaultCanonicalPoint) => VaultFinancialValue,
): ChartDataPoint[] => toChartPoints(metrics?.canonicalMetrics?.points, pick)

/**
 * A position's growth series as chart points. A bucket the API could not value stays a gap rather
 * than becoming a zero — the series is marked to NAV and can be negative, so a zero is a real value
 * here, not an absence.
 *
 * The window always spans the whole interval, however young the position is, so the buckets before
 * it existed are dropped: a month-long window on a week-old position would otherwise be mostly empty
 * space. Only the run at the front goes; a gap later on is a gap in the data and stays visible.
 */
/**
 * The rate a growth bucket reports, once the endpoint carries one. Whether it arrives as a plain
 * number or wrapped in the usual envelope is not settled, so both are accepted; anything else counts
 * as absent and the tooltip simply leaves the rate out.
 */
const growthPointApr = (point: VaultGrowthPoint): number | undefined => {
  const { apr } = point
  if (apr === undefined || apr === null) return undefined
  if (typeof apr === 'object') return financialNumber(apr)
  const parsed = Number(apr)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const toGrowthSeries = (history?: VaultGrowthHistory): ChartDataPoint[] => {
  const points = (history?.points || []).map(point => ({
    value: financialNumber(point) ?? null,
    timestamp: point.timestamp ?? undefined,
    rate: growthPointApr(point),
  }))
  const firstValued = points.findIndex(point => point.value !== null)
  return firstValued > 0 ? points.slice(firstValued) : points
}

const toEpochSeconds = (iso?: string | null): number | undefined => {
  if (!iso) return undefined
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined
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
  apy: financialNumber(item.stats?.canonicalMetrics?.apy7d),
  tvl: financialNumber(item.stats?.canonicalMetrics?.current?.tvl),
  apyHistory: toChartPoints(item.metrics?.canonicalMetrics?.points, point => point.rate),
  tvlHistory: toChartPoints(item.metrics?.canonicalMetrics?.points, point => point.tvl),
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
  apy: financialNumber(detail.stats?.canonicalMetrics?.apy7d),
  tvl: financialNumber(detail.stats?.canonicalMetrics?.current?.tvl),
  apyHistory: toChartPoints(metrics?.canonicalMetrics?.points, point => point.rate),
  tvlHistory: toChartPoints(metrics?.canonicalMetrics?.points, point => point.tvl),
})

/** Yield in underlying-token units. Already in token units — dividing by decimals would halve it twice. */
const toVaultEarnings = (item: VaultPositionItem): number | undefined =>
  financialNumber(
    item.vaultEarnings
      ? {
          value: item.vaultEarnings.amount,
          status: item.vaultEarnings.status,
          reason: item.vaultEarnings.reason,
          valuationQuality: item.vaultEarnings.valuationQuality,
          asOf: item.vaultEarnings.asOf,
        }
      : null,
  )

const toHoldingPeriodReturnUsd = (item: VaultPositionItem): number | undefined =>
  financialNumber({
    value: item.holdingPeriodReturnUsd ?? null,
    status: item.holdingPeriodReturnStatus ?? '',
    reason: item.holdingPeriodReturnReason ?? null,
    valuationQuality: '',
    asOf: item.holdingPeriodReturnAsOf ?? null,
  })

export const toUserVaultPosition = (item: VaultPositionItem): UserVaultPosition => {
  const v = item.vault
  const summary = item.pendingWithdrawalSummary
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
    apy: financialNumber(v.stats?.canonicalMetrics?.apy7d),
    tvl: financialNumber(v.stats?.canonicalMetrics?.current?.tvl),
    apyHistory: [],
    tvlHistory: [],
    balance: Number(item.underlyingEquivalent) || 0,
    balanceUsd: Number(item.usdValue) || 0,
    earned: toVaultEarnings(item),
    earnedUsd: toHoldingPeriodReturnUsd(item),
    pendingWithdrawal:
      summary && summary.count > 0
        ? { count: summary.count, status: summary.latestStatus, etaAt: toEpochSeconds(summary.etaExpectedAt) }
        : undefined,
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

/** The one native route that can take a new request for this asset. A route without terms cannot be
 *  used even when it reports itself available. */
export const getBoringQueueRoute = (asset?: VaultSupportedAsset): VaultWithdrawalRoute | undefined =>
  asset?.withdrawalRoutes?.find(
    route => route.queueFamily === VaultQueueFamily.BORING_QUEUE && route.available && Boolean(route.limits),
  )

/** Requests the queue is still holding shares for — the only ones the user can act on. An expired
 *  one is still actionable: its payout is gone, but the escrowed shares can be reclaimed. */
export const isOpenWithdrawRequest = (request: VaultWithdrawRequest) =>
  request.status === VaultWithdrawRequestStatus.REQUESTED ||
  request.status === VaultWithdrawRequestStatus.PENDING ||
  request.status === VaultWithdrawRequestStatus.EXPIRED

/** Oldest first: the request the user has been waiting on longest is the one to show and act on. */
export const getOpenWithdrawRequests = (requests?: VaultWithdrawRequest[]) =>
  (requests || [])
    .filter(isOpenWithdrawRequest)
    .sort((a, b) => (toEpochSeconds(a.requestedAt) ?? 0) - (toEpochSeconds(b.requestedAt) ?? 0))

/** When the queue will let a solver fill the request, in unix seconds. */
export const getWithdrawRequestMaturityAt = (request: VaultWithdrawRequest) => toEpochSeconds(request.readyAt)

export const getWithdrawRequestExpiryAt = (request: VaultWithdrawRequest) => toEpochSeconds(request.deadline)

/** Cancellation needs the original struct the queue hashed; the API withholds it when it could not
 *  verify the request against its on-chain id. */
export const getWithdrawRequestCancellation = (request: VaultWithdrawRequest) =>
  request.cancellation?.boringRequest ? request.cancellation : undefined

export type VaultDetailTab = 'deposit' | 'withdraw'

export const buildVaultDetailPath = (chainId: number, vaultId: string, tab?: VaultDetailTab) => {
  const path = APP_PATHS.EARN_VAULT_DETAIL.replace(':chainId', String(chainId)).replace(':vaultId', vaultId)
  return tab ? `${path}?tab=${tab}` : path
}
