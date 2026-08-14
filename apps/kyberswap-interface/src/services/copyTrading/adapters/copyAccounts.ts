import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type {
  CopyAccountSummary,
  PendingSellObligation,
  PinnedStableBalanceStatus,
  WalletBalanceRow,
} from 'services/copyTrading/types/copyRuns'
import type { Address, CopyAccountStatus, ResponseMeta } from 'services/copyTrading/types/primitives'
import type {
  CopyAccountBalancesResponse,
  CopyAccountResponse,
  CopyAccountWalletInventoryResponse,
  OwnerCopyAccountsResponse,
  PendingSellObligationsResponse,
} from 'services/copyTrading/types/responses'

import { type ApiAgentSnapshot, toAgentSnapshot } from './agents'
import {
  type ApiCursorResponse,
  type ApiMetric,
  type ApiSingleResponse,
  type ApiToken,
  type ApiValuation,
  chainIdNumber,
  cursorResponse,
  isValuationRenderable,
  metricValue,
  singleResponse,
  toToken,
} from './shared'

type ApiCopyAccount = {
  chainId?: string
  copyAccount?: string
  ownerAddress?: string
  status?: string
  activeCopyRuns?: ApiMetric
  totalAllocatedUsd?: ApiMetric
  portfolioValueUsd?: ApiMetric
  availableBalanceUsd?: ApiMetric
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  openPositionCount?: ApiMetric
  closedPositionCount?: ApiMetric
  leftoverPositionCount?: ApiMetric
  leftoverValueUsd?: ApiMetric
  flatFeesCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
  estimatedCashbackPendingUsd?: ApiMetric
  agentSnapshot?: ApiAgentSnapshot
  copyRunId?: string
  startedAt?: string
  stoppedAt?: string
  addCapitalAvailability?: AdvisoryActionAvailability
  stopCopyAvailability?: AdvisoryActionAvailability
  withdrawQuoteAvailability?: AdvisoryActionAvailability
}

type ApiWalletBalance = {
  chainId?: string
  copyAccount?: string
  tokenAddress?: string
  amountDecimal?: string
  balanceSource?: string
  freshnessStatus?: string
  balanceAsOfBlock?: string
  cachedAt?: string
  stalenessReason?: string
  token?: ApiToken
  currentValuation?: ApiValuation
}

type ApiBalancesResponse = ApiCursorResponse<ApiWalletBalance> & {
  pinnedStableBalance?: {
    status?: string
    balance?: ApiWalletBalance
  }
}

type ApiWalletInventoryResponse = {
  data?: ApiWalletBalance[]
  walletInventoryValueUsd?: ApiMetric
  complete?: boolean
  pinnedStableBalance?: ApiBalancesResponse['pinnedStableBalance']
  meta?: ResponseMeta
}

const toCopyAccountStatus = (status?: string): CopyAccountStatus => {
  const value = status?.replace('COPY_ACCOUNT_STATUS_', '').toLowerCase()
  return (
    value === 'active' || value === 'closing' || value === 'closed' || value === 'stopped' ? value : 'unknown'
  ) as CopyAccountStatus
}

const toCopyAccount = (account: ApiCopyAccount): CopyAccountSummary => ({
  chainId: chainIdNumber(account.chainId),
  copyAccount: (account.copyAccount || '') as Address,
  ownerAddress: (account.ownerAddress || '') as Address,
  status: toCopyAccountStatus(account.status),
  activeCopyRuns: metricValue(account.activeCopyRuns),
  totalAllocatedUsd: metricValue(account.totalAllocatedUsd),
  portfolioValueUsd: metricValue(account.portfolioValueUsd),
  availableBalanceUsd: metricValue(account.availableBalanceUsd),
  realizedPnlUsd: metricValue(account.realizedPnlUsd),
  unrealizedPnlUsd: metricValue(account.unrealizedPnlUsd),
  openPositionCount: metricValue(account.openPositionCount),
  closedPositionCount: metricValue(account.closedPositionCount),
  leftoverPositionCount: metricValue(account.leftoverPositionCount),
  leftoverValueUsd: metricValue(account.leftoverValueUsd),
  flatFeesCapturedUsd: metricValue(account.flatFeesCapturedUsd),
  cashbackReceivedUsd: metricValue(account.cashbackReceivedUsd),
  netFeeCostUsd: metricValue(account.netFeeCostUsd),
  estimatedCashbackPendingUsd: metricValue(account.estimatedCashbackPendingUsd),
  copyRunId: account.copyRunId,
  startedAt: account.startedAt,
  stoppedAt: account.stoppedAt,
  addCapitalAvailability: account.addCapitalAvailability,
  stopCopyAvailability: account.stopCopyAvailability,
  withdrawQuoteAvailability: account.withdrawQuoteAvailability,
  metrics: {
    activeCopyRuns: account.activeCopyRuns,
    totalAllocatedUsd: account.totalAllocatedUsd,
    portfolioValueUsd: account.portfolioValueUsd,
    availableBalanceUsd: account.availableBalanceUsd,
    realizedPnlUsd: account.realizedPnlUsd,
    unrealizedPnlUsd: account.unrealizedPnlUsd,
    openPositionCount: account.openPositionCount,
    closedPositionCount: account.closedPositionCount,
    leftoverPositionCount: account.leftoverPositionCount,
    leftoverValueUsd: account.leftoverValueUsd,
    flatFeesCapturedUsd: account.flatFeesCapturedUsd,
    cashbackReceivedUsd: account.cashbackReceivedUsd,
    netFeeCostUsd: account.netFeeCostUsd,
    estimatedCashbackPendingUsd: account.estimatedCashbackPendingUsd,
  },
  agentSnapshot: account.agentSnapshot ? toAgentSnapshot(account.agentSnapshot) : undefined,
})

const toWalletBalance = (balance: ApiWalletBalance): WalletBalanceRow => ({
  chainId: chainIdNumber(balance.chainId),
  copyAccount: (balance.copyAccount || '') as Address,
  tokenAddress: (balance.tokenAddress || '') as Address,
  amountDecimal: balance.amountDecimal || '0',
  balanceSource: balance.balanceSource || '',
  freshnessStatus: balance.freshnessStatus || '',
  balanceAsOfBlock: balance.balanceAsOfBlock || '',
  cachedAt: balance.cachedAt || '',
  stalenessReason: balance.stalenessReason,
  token: balance.token ? toToken(balance.token) : undefined,
  valueUsd: isValuationRenderable(balance.currentValuation) ? balance.currentValuation?.valueUsd : undefined,
  currentValuation: balance.currentValuation,
})

const toPinnedStableBalance = (pinnedStableBalance?: ApiBalancesResponse['pinnedStableBalance']) =>
  pinnedStableBalance
    ? {
        status: pinnedStableBalance.status as PinnedStableBalanceStatus | undefined,
        balance: pinnedStableBalance.balance ? toWalletBalance(pinnedStableBalance.balance) : undefined,
      }
    : undefined

export const adaptCopyAccountsResponse = (response: ApiCursorResponse<ApiCopyAccount>): OwnerCopyAccountsResponse =>
  cursorResponse(response, toCopyAccount)

export const adaptCopyAccountResponse = (response: ApiSingleResponse<ApiCopyAccount>): CopyAccountResponse =>
  singleResponse(response, toCopyAccount)

export const adaptCopyAccountBalancesResponse = (response: ApiBalancesResponse): CopyAccountBalancesResponse => ({
  ...cursorResponse(response, toWalletBalance),
  pinnedStableBalance: toPinnedStableBalance(response.pinnedStableBalance),
})

export const adaptCopyAccountWalletInventoryResponse = (
  response: ApiWalletInventoryResponse,
): CopyAccountWalletInventoryResponse => ({
  data: (response.data || []).map(toWalletBalance),
  walletInventoryValueUsd: response.walletInventoryValueUsd,
  complete: response.complete === true,
  pinnedStableBalance: toPinnedStableBalance(response.pinnedStableBalance),
  meta: response.meta,
})

export const adaptPendingSellObligationsResponse = (
  response: ApiCursorResponse<PendingSellObligation>,
): PendingSellObligationsResponse => cursorResponse(response, obligation => obligation)
