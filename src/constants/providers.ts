import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from './networks'

export class AppJsonRpcProvider extends StaticJsonRpcProvider {
  constructor(url: string, chainId: ChainId) {
    // Including networkish allows ethers to skip the initial detectNetwork call.
    super(url, /* networkish= */ { chainId, name: NETWORKS_INFO[chainId].name })

    // NB: Third-party providers (eg MetaMask) will have their own polling intervals,
    // which should be left as-is to allow operations (eg transaction confirmation) to resolve faster.
    // Network providers (eg AppJsonRpcProvider) need to update less frequently to be considered responsive.
    this.pollingInterval = 12_000
  }
}
