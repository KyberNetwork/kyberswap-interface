import {
  VAULT_FINANCIAL_NUMERIC_STATUSES,
  VaultApiDetailItem,
  VaultApiListItem,
  VaultApiMetrics,
  VaultBalanceHistory,
  VaultCanonicalPoint,
  VaultFinancialValue,
  VaultGrowthHistory,
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
 * What the vault's unit is called on screen. The API overrides the underlying's own symbol for the
 * vaults whose accounting token is a wrapper — Liquid ETH accounts in WETH but reads as ETH — and
 * falls back to the underlying for anything it does not name.
 */
export const toDisplaySymbol = (baseToken?: { symbol?: string }, underlying?: { symbol?: string }): string =>
  baseToken?.symbol || underlying?.symbol || ''

/**
 * The mark beside that name, taken from whichever token supplies the name: a vault the API renames
 * reads as a different asset than the wrapper it accounts in, so the wrapper's mark would contradict
 * it. Nothing to show leaves `TokenLogo` to stand in with its unknown-token mark.
 */
export const toDisplayLogo = (baseToken?: { symbol?: string; logo?: string }, underlying?: { logo?: string }): string =>
  baseToken?.symbol ? baseToken.logo || '' : underlying?.logo || ''

/**
 * A position's growth series as chart points. A bucket the API could not value stays a gap rather
 * than becoming a zero — the series is marked to NAV and can be negative, so a zero is a real value
 * here, not an absence.
 *
 * The window always spans the whole interval, however young the position is, so the buckets before
 * it existed are dropped: a month-long window on a week-old position would otherwise be mostly empty
 * space. Only the run at the front goes; a gap later on is a gap in the data and stays visible.
 */
const toPositionSeries = <Point extends { timestamp?: string | null }>(
  points: Point[] | undefined,
  pick: (point: Point) => VaultFinancialValue,
): ChartDataPoint[] => {
  const mapped = (points || []).map(point => ({
    value: financialNumber(pick(point)) ?? null,
    timestamp: point.timestamp ?? undefined,
  }))
  const firstValued = mapped.findIndex(point => point.value !== null)
  return firstValued > 0 ? mapped.slice(firstValued) : mapped
}

/** The wallet-held balance over time. Each point already includes the yield inside it. */
export const toBalanceSeries = (history?: VaultBalanceHistory): ChartDataPoint[] =>
  toPositionSeries(history?.points, point => point.balance)

export const toGrowthSeries = (history?: VaultGrowthHistory): ChartDataPoint[] =>
  toPositionSeries(history?.points, point => point)

const toEpochSeconds = (iso?: string | null): number | undefined => {
  if (!iso) return undefined
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined
}

export const toVaultInfo = (item: VaultApiListItem): VaultInfo => ({
  id: item.vaultId,
  token: toDisplaySymbol(item.baseToken, item.underlyingToken),
  tokenIcon: toDisplayLogo(item.baseToken, item.underlyingToken),
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
  token: toDisplaySymbol(detail.baseToken, detail.underlyingToken),
  tokenIcon: toDisplayLogo(detail.baseToken, detail.underlyingToken),
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

/**
 * The same yield in USD. It is the earnings figure priced, not the holding-period return: that one
 * marks the whole position to NAV and so carries the token's own price move, which would leave a
 * positive yield sitting next to a negative dollar amount.
 */
const toVaultEarningsUsd = (item: VaultPositionItem): number | undefined =>
  financialNumber(
    item.vaultEarnings
      ? {
          value: item.vaultEarnings.usdEquivalent,
          status: item.vaultEarnings.usdStatus,
          reason: item.vaultEarnings.usdReason,
          valuationQuality: item.vaultEarnings.usdValuationQuality,
          asOf: item.vaultEarnings.usdAsOf,
        }
      : null,
  )

/**
 * What the position is worth, a withdrawal already in flight included. The flat `usdValue` counts
 * only the shares still in the wallet, so queuing a withdrawal read as the balance dropping by the
 * amount being withdrawn — the money looked gone until the payout landed. `ownedValue` carries the
 * parts and `totalUsd` is their sum, which is the only one to read: `pendingPayoutUsd` and
 * `refundableSharesUsd` are the same shares in another state, so adding either would count it twice.
 *
 * An expired request leaves `totalUsd` uncomputable. The wallet's own share is still true, so it
 * stands in — understating what can be reclaimed rather than leaving the row blank or, worse,
 * guessing at a total.
 */
const toOwnedUsd = (item: VaultPositionItem): number =>
  financialNumber(item.ownedValue?.totalUsd) ?? (Number(item.usdValue) || 0)

export const toUserVaultPosition = (item: VaultPositionItem): UserVaultPosition => {
  const v = item.vault
  const summary = item.pendingWithdrawalSummary
  return {
    id: v.id,
    vaultId: v.id,
    shareBalanceRaw: item.shareBalanceRaw || '0',
    shareDecimals: v.shareToken?.decimals ?? 18,
    shareSymbol: v.shareToken?.symbol || '',
    token: toDisplaySymbol(v.baseToken, v.underlyingToken),
    tokenIcon: toDisplayLogo(v.baseToken, v.underlyingToken),
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
    balanceUsd: toOwnedUsd(item),
    earned: toVaultEarnings(item),
    earnedUsd: toVaultEarningsUsd(item),
    pendingWithdrawal:
      summary && summary.count > 0 ? { count: summary.count, status: summary.latestStatus } : undefined,
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

/**
 * Every request, the ones still running above the ones already over. A running request is ordered
 * oldest first — the one waited on longest is the one to act on — and a settled one newest first,
 * since the last thing that happened is the one being looked for.
 */
export const getWithdrawRequestsInProgress = (requests?: VaultWithdrawRequest[]) => {
  const all = requests || []
  const open = all
    .filter(isOpenWithdrawRequest)
    .sort((a, b) => (toEpochSeconds(a.requestedAt) ?? 0) - (toEpochSeconds(b.requestedAt) ?? 0))
  const settled = all
    .filter(request => !isOpenWithdrawRequest(request))
    .sort((a, b) => (toEpochSeconds(b.requestedAt) ?? 0) - (toEpochSeconds(a.requestedAt) ?? 0))
  return [...open, ...settled]
}

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
