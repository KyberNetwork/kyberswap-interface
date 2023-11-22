import { ChainId, Fraction, Token } from '@kyberswap/ks-sdk-core'

export interface ClassicPosition {
  id: string
  ownerOriginal: string
  liquidityTokenBalance: string
  liquidityTokenBalanceIncludingStake: string
  pool: {
    id: string
  }
  amount0: string
  amount1: string
  amountUSD: string
  pendingFee0: string
  pendingFee1: string
  pendingFeeUSD: string
  myPoolApr: string
}

export interface ClassicPoolData {
  chainId?: ChainId
  id: string
  protocol?: 'classic'
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

  // kn fields
  address: string
  feeUSDLast: number
  volumeUSDLast: number
  apr: number
  farmAPR?: number
  allPositionsUSD?: Fraction
  positions?: ClassicPosition[]
}

export type CommonReturn = {
  loading: boolean
  error: Error | undefined
  data: ClassicPoolData[]
}
