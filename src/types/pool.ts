import { EVMNetworkInfo } from 'constants/networks/type'

export type ElasticPoolDetail = {
  chain?: EVMNetworkInfo['poolFarmRoute']
  protocol?: 'elastic'
  address: string
  feeTier: number

  token0: {
    address: string
    name: string
    symbol: string
    decimals: number
  }

  token1: {
    address: string
    name: string
    symbol: string
    decimals: number
  }

  // for tick math
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: number

  tvlUSD: number

  volumeUSDLast: number
  volumeUSDLast24h: number
  tvlUSDLast24h: number

  apr: number
  farmAPR?: number
}
