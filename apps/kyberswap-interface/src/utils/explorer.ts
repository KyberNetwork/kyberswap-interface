import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from 'constants/networks'

export function getEtherscanLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block',
): string {
  const prefix = NETWORKS_INFO[chainId].etherscanUrl

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      if (chainId === ChainId.ZKSYNC) return `${prefix}/address/${data}`
      return `${prefix}/token/${data}`
    }
    case 'block': {
      return `${prefix}/block/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}
