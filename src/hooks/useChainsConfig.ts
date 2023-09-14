import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetChainsConfigurationQuery } from 'services/ksSetting'

import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'

export enum ChainState {
  NEW = 'new',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintained',
}

export type ChainStateMap = { [chain in ChainId]: ChainState }

const defaultData = MAINNET_NETWORKS.map(chainId => NETWORKS_INFO[chainId])
export default function useChainsConfig() {
  const { data } = useGetChainsConfigurationQuery()
  const globalConfig = useKyberswapGlobalConfig()

  return useMemo(() => {
    const hasConfig = !!data
    const chains: NetworkInfo[] = (data || defaultData).map(chain => {
      const chainId = +chain.chainId as ChainId
      const chainState = hasConfig ? globalConfig?.chainStates?.[chainId] : ChainState.ACTIVE
      return {
        ...NETWORKS_INFO[chainId],
        ...chain, // BE config
        chainId,
        state: chainState,
      }
    })
    return {
      activeChains: chains.filter(e => [ChainState.ACTIVE, ChainState.NEW].includes(e.state)),
      supportedChains: chains.filter(e =>
        [ChainState.ACTIVE, ChainState.NEW, ChainState.MAINTENANCE].includes(e.state),
      ),
    }
  }, [data, globalConfig])
}
