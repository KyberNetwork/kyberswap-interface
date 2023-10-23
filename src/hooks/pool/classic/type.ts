import { Token } from '@kyberswap/ks-sdk-core'

export interface ClassicPoolData {
  id: string
  amp: string
  fee: number
  reserve0: string
  reserve1: string
  vReserve0: string
  vReserve1: string
  totalSupply: string
  reserveUSD: string
  volumeUSD: string
  feeUSD: string
  oneDayVolumeUSD: string
  oneDayVolumeUntracked: string
  oneDayFeeUSD: string
  oneDayFeeUntracked: string
  token0: Token
  token1: Token
}

export type CommonReturn = {
  loading: boolean
  error: Error | undefined
  data: ClassicPoolData[]
}
