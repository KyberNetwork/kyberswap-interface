export * from 'pages/Earns/types/smartExit'
export * from 'pages/Earns/types/position'
export * from 'pages/Earns/types/pool'
export * from 'pages/Earns/types/reward'

export interface FeeInfo {
  balance0: string | number
  balance1: string | number
  amount0: string | number
  amount1: string | number
  value0: number
  value1: number
  totalValue: number
}

export interface TokenInfo {
  address: string
  symbol: string
  logo: string
  decimals: number
  chainId: number
}
