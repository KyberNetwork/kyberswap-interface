import { ChainId, Fraction, Token } from '@kyberswap/ks-sdk-core'

export type ElasticPosition = {
  id: string
  ownerOriginal: string
  poolID: string
  tickLower: string
  tickUpper: string
  liquidity: string
  depositedPosition: {
    farm: string
  }
  createdAtTimestamp: string
  lastCollectedFeeAt: string
  lastHarvestedFarmRewardAt: string
  amount0: string
  amount1: string
  amountUSD: string
  depositedUSD: string
  outOfRange: boolean
  pendingFee0: string
  pendingFee1: string
  pendingFeeUSD: string
  myPoolApr: string
}

export type ElasticPoolDetail = {
  chainId?: ChainId
  protocol?: 'elastic'
  address: string
  feeTier: number

  token0: Token
  token1: Token

  // for tick math
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: number

  tvlUSD: number

  feeUSDLast: number
  volumeUSDLast: number
  volumeUSDLast24h: number
  tvlUSDLast24h: number

  apr: number
  farmAPR?: number

  positions?: ElasticPosition[]
  allPositionsUSD?: Fraction
}
