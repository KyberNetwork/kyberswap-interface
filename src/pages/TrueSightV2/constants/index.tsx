import { ChainId } from '@kyberswap/ks-sdk-core'

export const SUPPORTED_NETWORK_KYBERAI: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'ethereum',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.AVAXMAINNET]: 'avalanche',
  [ChainId.MATIC]: 'polygon',
  [ChainId.FANTOM]: 'fantom',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.OPTIMISM]: 'optimism',
}
