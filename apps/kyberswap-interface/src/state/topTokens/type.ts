import { ChainId } from '@kyberswap/ks-sdk-core'

export type TopToken = {
  chainId: ChainId
  address: string
  symbol: string
  name: string
  decimals: number
  marketCap: number
  logoURI: string
  isWhitelisted: boolean
}
