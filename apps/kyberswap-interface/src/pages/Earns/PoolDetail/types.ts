import { PoolDetail } from 'services/zapEarn'

import { Exchange } from 'pages/Earns/constants'
import { EarnPool } from 'pages/Earns/types'

type ExplorerPoolExtras = Partial<Omit<EarnPool, 'address' | 'exchange' | 'type' | 'programs' | 'tokens'>>

export type Pool = Omit<PoolDetail, 'exchange' | 'type' | 'programs'> &
  ExplorerPoolExtras & {
    exchange?: Exchange
    type?: PoolDetail['type']
    programs?: PoolDetail['programs']
    tokens: PoolDetail['tokens']
  }
