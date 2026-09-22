import earnServiceApi from 'services/earn'

export interface VaultApiToken {
  address: string
  symbol: string
  decimals: number
  logo: string
}

export interface VaultApiProvider {
  key: string
  name: string
  logo: string
}

export interface VaultApiChain {
  id: number
  name: string
  logo: string
}

/**
 * A figure the API vouches for, or an explained absence. `value` carries a decimal string only for
 * the statuses that permit a number; for the rest there is no figure, which is not the same as zero.
 */
export interface VaultFinancialValue {
  value: string | null
  /** Wider than the documented set on purpose: an unrecognised status reads as unavailable. */
  status: string
  reason: string | null
  valuationQuality: string
  asOf: string | null
}

export const VAULT_FINANCIAL_NUMERIC_STATUSES = ['COMPUTABLE', 'LIMITED_COVERAGE']

export interface VaultCanonicalPoint {
  timestamp: string | null
  tvl: VaultFinancialValue
  rate: VaultFinancialValue
}

/** Headline figures and their chart series. `points` is empty on the current-only envelope in `stats`. */
export interface VaultCanonicalMetrics {
  rateKind: string
  rateLookback: string
  interval?: string
  stepSeconds: number
  methodology: string
  current: VaultCanonicalPoint
  apy1d: VaultFinancialValue
  apy7d: VaultFinancialValue
  apy30d: VaultFinancialValue
  points: VaultCanonicalPoint[]
}

export interface VaultApiMetrics {
  canonicalMetrics: VaultCanonicalMetrics
}

export interface VaultApiStats {
  sharePrice: string
  canonicalMetrics: VaultCanonicalMetrics
}

export interface VaultApiListItem {
  vaultId: string
  vaultAddress: string
  provider: VaultApiProvider
  name: string
  chain: VaultApiChain
  shareToken: VaultApiToken
  underlyingToken: VaultApiToken
  assetGroup: string
  metrics: VaultApiMetrics
  stats: VaultApiStats
}

export interface VaultApiDetailItem {
  vaultId: string
  name: string
  provider: VaultApiProvider
  chain: VaultApiChain
  vaultAddress: string
  shareToken: VaultApiToken
  underlyingToken: VaultApiToken
  assetGroup: string
  stats: VaultApiStats
}

export interface VaultApiPagination {
  totalItems: number
  page: number
  pageSize: number
}

export interface VaultListResponseData {
  vaults: VaultApiListItem[]
  pagination: VaultApiPagination
}

export enum VaultQueueFamily {
  BORING_QUEUE = 'BORING_QUEUE',
  ATOMIC_QUEUE = 'ATOMIC_QUEUE',
  UNKNOWN = 'UNKNOWN',
}

/** Terms the queue enforces, in the queue's own units. */
export interface VaultQueueLimits {
  secondsToMaturity: number
  minimumSecondsToDeadline: number
  /** Basis points. */
  minDiscount: number
  maxDiscount: number
  /** Raw share-token units. */
  minimumShares: string
}

/** One native redemption route for an asset: which queue takes it, and whether it is open. */
export interface VaultWithdrawalRoute {
  queueFamily: string
  queueAddress: string
  available: boolean
  reason: string | null
  observedBlockNumber: number
  observedBlockHash: string | null
  limits: VaultQueueLimits | null
}

export interface VaultSupportedAsset {
  assetAddress: string
  symbol: string
  decimals: number
  supportsDeposit: boolean
  supportsWithdraw: boolean
  isActive: boolean
  withdrawalRoutes?: VaultWithdrawalRoute[]
}

/** Wire names on the position summary differ from the ones the request endpoints use. */
export enum VaultPendingWithdrawalStatus {
  REQUESTED = 'WithdrawStatusRequested',
  PENDING = 'WithdrawStatusPending',
  COMPLETED = 'WithdrawStatusCompleted',
  SUPERSEDED = 'WithdrawStatusSuperseded',
  CANCELLED = 'WithdrawStatusCancelled',
  EXPIRED = 'WithdrawStatusExpired',
  UNKNOWN = 'WithdrawStatusUnknown',
}

export interface VaultPendingWithdrawalSummary {
  count: number
  latestStatus: string
  etaExpectedAt: string | null
  requestId: string
}

export enum VaultWithdrawRequestStatus {
  REQUESTED = 'REQUESTED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SUPERSEDED = 'SUPERSEDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  UNKNOWN = 'UNKNOWN',
}

/** The eight fields of the on-chain request struct, returned verbatim so they can be passed straight
 *  back to `cancelOnChainWithdraw`, which re-hashes the whole struct to find the request. */
export interface VaultBoringRequest {
  nonce: string
  user: string
  assetOut: string
  amountOfShares: string
  amountOfAssets: string
  creationTime: string
  secondsToMaturity: string
  secondsToDeadline: string
}

/** Present only once the API has verified the request against its on-chain id. */
export interface VaultRequestCancellation {
  contractAddress: string
  method: string
  boringRequest?: VaultBoringRequest
}

export interface VaultWithdrawRequest {
  requestId: string
  queueAddress: string
  queueFamily: string
  status: string
  shareTokenAddress: string
  assetOutAddress: string
  requestedSharesRaw: string
  escrowedSharesRaw: string
  refundableSharesRaw: string
  originalExpectedAssetsRaw: string
  /** Null once the deadline has passed: the fixed payout is no longer executable. */
  pendingPayoutAssetsRaw: string | null
  receivedAssetsRaw: string
  filledSharesRaw: string
  requestedAt: string | null
  readyAt: string | null
  deadline: string | null
  completedAt: string | null
  cancelledAt: string | null
  expiredAt: string | null
  requestTxHash: string | null
  completionTxHash: string | null
  cancellationTxHash: string | null
  supersededByRequestId: string | null
  metadataStatus: string
  metadataReason: string | null
  cancellation?: VaultRequestCancellation | null
  boringRequest?: VaultBoringRequest | null
}

export interface VaultWithdrawalRequestsSource {
  status: string
  asOf: string | null
  blockNumber?: number
  eventSeq?: number
  readAt?: string
}

export interface VaultWithdrawalRequestsResponse {
  requests: VaultWithdrawRequest[]
  nextCursor: string | null
  source: VaultWithdrawalRequestsSource
}

/** One bucket of a position's growth series; carries the same envelope as every other figure. */
export interface VaultGrowthPoint extends VaultFinancialValue {
  timestamp: string | null
  /**
   * The vault's annualised rate over this bucket. Not served yet — the tooltip shows it as soon as
   * it is, and the shape is unconfirmed, so it is read through `growthPointApr`.
   */
  apr?: VaultFinancialValue | string | number | null
}

/**
 * A position's own history. Buckets before the wallet held anything come back unavailable rather
 * than as zero, and the figure is marked to NAV, so it can be negative.
 */
export interface VaultGrowthHistory {
  /** Which figure the series plots, e.g. `holdingPeriodReturnUsd`. */
  metric: string
  currency: string
  methodology: string
  interval: string
  stepSeconds: number
  windowStart: string | null
  windowEnd: string | null
  /** When the position's accounting starts; everything before it is outside coverage. */
  accountingOrigin: string | null
  coverageStart: string | null
  coverageEnd: string | null
  current: VaultGrowthPoint
  points: VaultGrowthPoint[]
}

/** Cumulative yield in underlying-token units. Its USD equivalent is available separately. */
export interface VaultEarnings {
  amount: string | null
  assetAddress: string
  status: string
  reason: string | null
  valuationQuality: string
  methodology: string
  coverageStart: string | null
  coverageEnd: string | null
  asOf: string | null
  usdEquivalent: string | null
  usdStatus: string
  usdReason: string | null
  usdValuationQuality: string
  usdAsOf: string | null
}

/** `totalUsd` is wallet plus pending payout. Refundable shares are the alternative to that payout,
 *  never an addition to it. */
export interface VaultPositionOwnedValue {
  asOf: string | null
  escrowedSharesRaw: string | null
  walletUsd: VaultFinancialValue
  pendingPayoutUsd: VaultFinancialValue
  refundableSharesUsd: VaultFinancialValue
  totalUsd: VaultFinancialValue
}

export interface VaultPositionVault {
  id: string
  address: string
  shareToken: VaultApiToken
  underlyingToken: VaultApiToken
  provider: VaultApiProvider
  assetGroup: string
  stats: VaultApiStats
  name?: string
}

export interface VaultPositionItem {
  chain: VaultApiChain
  wallet: string
  vault: VaultPositionVault
  status: string
  shareBalanceRaw: string
  shareBalance: string
  underlyingEquivalentRaw: string
  underlyingEquivalent: string
  usdValue: string
  lastBalanceChangeAt: number
  accountingOrigin?: string | null
  vaultEarnings?: VaultEarnings | null
  /** Cumulative USD return, marked to NAV; it carries USD price exposure, so it can be negative
   *  while token earnings are positive. */
  holdingPeriodReturnUsd?: string | null
  holdingPeriodReturnStatus?: string
  holdingPeriodReturnReason?: string | null
  holdingPeriodReturnAsOf?: string | null
  ownedValue?: VaultPositionOwnedValue | null
  pendingWithdrawalSummary?: VaultPendingWithdrawalSummary
}

export interface VaultPositionListResponseData {
  positions: VaultPositionItem[]
  pagination: VaultApiPagination
}

export interface VaultListParams {
  providers?: string
  assetGroup?: string
  chainIds?: string
  keyword?: string
  page?: number
  pageSize?: number
  sorts?: string
}

export interface VaultPositionListParams {
  userAddress: string
  statuses?: string
  providers?: string
  assetGroup?: string
  chainIds?: string
  keyword?: string
  page?: number
  pageSize?: number
  sorts?: string
}

export type VaultInterval = '1d' | '7d' | '30d'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  requestId: string
}

const vaultApi = earnServiceApi.injectEndpoints({
  endpoints: builder => ({
    vaultList: builder.query<VaultListResponseData, VaultListParams>({
      query: params => ({
        url: `/v1/vaults`,
        params,
      }),
      transformResponse: (response: ApiEnvelope<VaultListResponseData>) => response.data,
    }),
    vaultDetail: builder.query<VaultApiDetailItem, { chainId: number; vaultId: string }>({
      query: ({ chainId, vaultId }) => ({
        url: `/v1/vaults/${chainId}/${vaultId}`,
      }),
      transformResponse: (response: ApiEnvelope<VaultApiDetailItem>) => response.data,
    }),
    vaultMetrics: builder.query<
      VaultApiMetrics,
      { chainId: number; vaultId: string; interval: VaultInterval; rateLookback?: VaultInterval }
    >({
      query: ({ chainId, vaultId, interval, rateLookback = '7d' }) => ({
        url: `/v1/vaults/${chainId}/${vaultId}/metrics`,
        // The window and the trailing-rate window are independent; sending only `interval` would
        // leave the rate lookback to the server default.
        params: { interval, rateLookback },
      }),
      transformResponse: (response: ApiEnvelope<{ metrics: VaultApiMetrics }>) => response.data.metrics,
    }),
    vaultSupportedAssets: builder.query<VaultSupportedAsset[], { chainId: number; vaultId: string }>({
      query: ({ chainId, vaultId }) => ({
        url: `/v1/vaults/${chainId}/${vaultId}/supported-assets`,
      }),
      transformResponse: (response: ApiEnvelope<{ assets: VaultSupportedAsset[] }>) => response.data.assets,
    }),
    vaultPositions: builder.query<VaultPositionListResponseData, VaultPositionListParams>({
      query: ({ userAddress, ...params }) => ({
        url: `/v1/vault-positions/wallets/${userAddress}`,
        params,
      }),
      transformResponse: (response: ApiEnvelope<VaultPositionListResponseData>) => response.data,
    }),
    vaultPositionDetail: builder.query<VaultPositionItem, { chainId: number; userAddress: string; vaultId: string }>({
      query: ({ chainId, userAddress, vaultId }) => ({
        url: `/v1/vault-positions/${chainId}/${userAddress}/${vaultId}`,
      }),
      transformResponse: (response: ApiEnvelope<VaultPositionItem>) => response.data,
    }),
    vaultPositionGrowthHistory: builder.query<
      VaultGrowthHistory,
      { chainId: number; userAddress: string; vaultId: string; interval: VaultInterval }
    >({
      query: ({ chainId, userAddress, vaultId, interval }) => ({
        url: `/v1/vault-positions/${chainId}/${userAddress}/${vaultId}/growth-history`,
        params: { interval },
      }),
      transformResponse: (response: ApiEnvelope<VaultGrowthHistory>) => response.data,
    }),
    vaultWithdrawalRequests: builder.query<
      VaultWithdrawalRequestsResponse,
      { chainId: number; userAddress: string; vaultId: string; pageSize?: number }
    >({
      query: ({ chainId, userAddress, vaultId, pageSize = 20 }) => ({
        url: `/v1/vault-positions/${chainId}/${userAddress}/${vaultId}/withdrawal-requests`,
        params: { pageSize },
      }),
      transformResponse: (response: ApiEnvelope<VaultWithdrawalRequestsResponse>) => response.data,
    }),
  }),
})

export const {
  useVaultListQuery,
  useVaultPositionGrowthHistoryQuery,
  useVaultDetailQuery,
  useVaultMetricsQuery,
  useVaultSupportedAssetsQuery,
  useVaultPositionsQuery,
  useVaultPositionDetailQuery,
  useVaultWithdrawalRequestsQuery,
} = vaultApi

export default vaultApi
