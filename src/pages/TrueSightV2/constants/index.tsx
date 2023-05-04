import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'

export const SUPPORTED_NETWORK_KYBERAI: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'ethereum',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.AVAXMAINNET]: 'avalanche',
  [ChainId.MATIC]: 'polygon',
  [ChainId.FANTOM]: 'fantom',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.OPTIMISM]: 'optimism',
}

export const NETWORK_IMAGE_URL: { [chain: string]: string } = {
  ethereum: NETWORKS_INFO[ChainId.MAINNET].icon,
  bsc: NETWORKS_INFO[ChainId.BSCMAINNET].icon,
  arbitrum: NETWORKS_INFO[ChainId.ARBITRUM].icon,
  optimism: NETWORKS_INFO[ChainId.OPTIMISM].icon,
  avalanche: NETWORKS_INFO[ChainId.AVAXMAINNET].icon,
  polygon: NETWORKS_INFO[ChainId.MATIC].icon,
  fantom: NETWORKS_INFO[ChainId.FANTOM].icon,
}
export const NETWORK_TO_CHAINID: { [chain: string]: ChainId } = {
  ethereum: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  arbitrum: ChainId.ARBITRUM,
  optimism: ChainId.OPTIMISM,
  avalanche: ChainId.AVAXMAINNET,
  polygon: ChainId.MATIC,
  fantom: ChainId.FANTOM,
}
