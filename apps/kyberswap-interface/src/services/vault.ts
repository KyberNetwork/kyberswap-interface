import zapEarnServiceApi from 'services/zapEarn'

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

export interface VaultApiMetricPoint {
  value: number
  timestamp: string
}

export interface VaultApiMetrics {
  apy: VaultApiMetricPoint[]
  tvl: VaultApiMetricPoint[]
}

export interface VaultApiStats {
  apy1d: number
  apy7d: number
  apy30d: number
  tvlUsd: number
  sharePrice: string
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

export interface VaultSupportedAsset {
  assetAddress: string
  symbol: string
  decimals: number
  supportsDeposit: boolean
  supportsWithdraw: boolean
  isActive: boolean
}

export interface VaultPendingWithdrawalSummary {
  count: number
  latestStatus: string
  etaExpectedAt: string
  requestId: string
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
  earnedUsd: string
  lastBalanceChangeAt: number
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

const vaultApi = zapEarnServiceApi.injectEndpoints({
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
    vaultMetrics: builder.query<VaultApiMetrics, { chainId: number; vaultId: string; interval: VaultInterval }>({
      query: ({ chainId, vaultId, interval }) => ({
        url: `/v1/vaults/${chainId}/${vaultId}/metrics`,
        params: { interval },
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
  }),
})

export const {
  useVaultListQuery,
  useVaultDetailQuery,
  useVaultMetricsQuery,
  useVaultSupportedAssetsQuery,
  useVaultPositionsQuery,
  useVaultPositionDetailQuery,
} = vaultApi

export default vaultApi
