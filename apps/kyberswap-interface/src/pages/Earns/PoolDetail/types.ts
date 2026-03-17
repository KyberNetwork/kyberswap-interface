import { PoolDetail } from 'services/zapEarn'

import { EarnPool } from 'pages/Earns/types'

export interface PoolToken {
  address: string
  symbol: string
  decimals: number
  logoURI?: string
  name?: string
  weight?: number
  swappable?: boolean
}

type ExplorerPoolExtras = Partial<Omit<EarnPool, 'address' | 'exchange' | 'type' | 'programs' | 'tokens'>>

export interface Pool extends ExplorerPoolExtras {
  address: string
  exchange?: string
  type?: string
  programs?: string[]
  tokens: Array<PoolToken>
  reserveUsd?: string
  amplifiedTvl?: string
  swapFee?: number
  timestamp?: number
  staticExtra?: string
  blockNumber?: number
  reserves?: PoolDetail['reserves']
  positionInfo?: PoolDetail['positionInfo']
  poolStats?: PoolDetail['poolStats']
}
