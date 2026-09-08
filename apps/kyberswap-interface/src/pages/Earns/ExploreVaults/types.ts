import { VaultWithdrawRequest } from 'services/vault'

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

export interface UserVaultPosition extends VaultInfo {
  vaultId: string
  shareBalanceRaw: string
  shareDecimals: number
  shareSymbol: string
  balance: number
  balanceUsd: number
  earned: number
  earnedUsd: number
  /** Requests the withdraw queue is still holding shares for. */
  withdrawRequests: VaultWithdrawRequest[]
}
