export interface ChartDataPoint {
  value: number
}

export enum VaultSortBy {
  APY = 'apy',
  TVL = 'tvl',
}

export enum VaultViewMode {
  GRID = 'grid',
  LIST = 'list',
}

export interface VaultInfo {
  id: string
  token: string
  tokenIcon: string
  chainId: number
  chainIcon: string
  chainName: string
  label: string
  partner: string
  partnerLogo: string
  apy: number
  tvl: number
  apyHistory: ChartDataPoint[]
  tvlHistory: ChartDataPoint[]
  disabled?: boolean
}

export enum WithdrawalStatus {
  NONE = 'none',
  REQUESTED = 'requested',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export interface UserVaultPosition extends VaultInfo {
  balance: number
  balanceUsd: number
  earned: number
  earnedUsd: number
  /** Remaining withdrawal processing time in seconds, 0 = ready, -1 = no pending */
  processingTimeSeconds: number
  withdrawalStatus: WithdrawalStatus
  /** Timestamp when withdrawal completed (only for COMPLETED status) */
  completedAt?: string
  /** Transaction hash (only for COMPLETED status) */
  txHash?: string
}
