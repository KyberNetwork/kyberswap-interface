import { ChainId } from '@kyberswap/ks-sdk-core'

import { SUPPORTED_NETWORKS } from 'constants/networks'
import { useWeb3React } from 'hooks'

export function useWalletSupportedChains(): ChainId[] {
  const { connector } = useWeb3React()

  switch (connector) {
    //case walletConnectV2:
    //case krystalWalletConnectV2:
    //  return [
    //    ...getChainsFromEIP155Accounts((connector as WalletConnectV2).provider?.session?.namespaces?.eip155?.accounts),
    //  ]
    //case gnosisSafe:
    //  return chainId ? [chainId] : SUPPORTED_NETWORKS
    //case blocto:
    //case bloctoInject:
    //  return BLOCTO_SUPPORTED_NETWORKS
    default:
      return SUPPORTED_NETWORKS
  }
}
