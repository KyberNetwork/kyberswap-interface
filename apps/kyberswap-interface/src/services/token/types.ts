import { ChainId } from '@kyberswap/ks-sdk-core'

export type GetTokenScoreParams = {
  chainId: ChainId
  tokenAddress: string
}

export type GetTokenScoreResponse = {
  code: number
  message: string
  data?: {
    score: string
  }
}
