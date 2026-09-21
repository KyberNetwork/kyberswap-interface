export interface ChartDataPoint {
  /** Null for a bucket the API could not value: the chart leaves a gap rather than drawing zero. */
  value: number | null
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
  /** Undefined while the figure is unavailable; the UI shows that rather than a zero. */
  apy?: number
  tvl?: number
  apyHistory: ChartDataPoint[]
  tvlHistory: ChartDataPoint[]
  disabled?: boolean
}

/** What the vault's withdraw queue is holding for this wallet, summarised on the position. */
export interface UserVaultPendingWithdrawal {
  count: number
  /** Wire status from the position summary, e.g. `WithdrawStatusPending`. */
  status: string
  /** Unix seconds the queue expects the newest request to become fillable. */
  etaAt?: number
}

export interface UserVaultPosition extends VaultInfo {
  vaultId: string
  shareBalanceRaw: string
  shareDecimals: number
  shareSymbol: string
  balance: number
  balanceUsd: number
  /** Cumulative yield in underlying-token units. */
  earned?: number
  /** Cumulative USD return, marked to NAV; negative when price moved against the position. */
  earnedUsd?: number
  pendingWithdrawal?: UserVaultPendingWithdrawal
}
