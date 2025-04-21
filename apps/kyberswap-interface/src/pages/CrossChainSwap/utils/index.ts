import { isEvmChain } from 'utils'
import { Chain, NonEvmChain, NonEvmChainInfo } from '../adapters'
import { NETWORKS_INFO } from 'constants/networks'
import { ChainId } from '@kyberswap/ks-sdk-core'

export const getNetworkInfo = (chain: Chain) => {
  if (isEvmChain(chain))
    return {
      name: NETWORKS_INFO[chain as ChainId].name,
      icon: NETWORKS_INFO[chain as ChainId].icon,
    }
  return NonEvmChainInfo[chain as NonEvmChain]
}
