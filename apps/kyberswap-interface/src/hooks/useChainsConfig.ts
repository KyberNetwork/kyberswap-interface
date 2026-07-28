import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetChainsConfigurationQuery } from 'services/ksSetting'

import { MAINNET_NETWORKS, NETWORKS_INFO as NETWORKS_INFO_HARDCODE } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'

export enum ChainState {
  NEW = 'new',
  ACTIVE = 'active',
  MAINTENANCE = 'maintained',
}

export type ChainStateMap = {
  [chain in ChainId]: ChainState
}

const cacheInfo: { [chain: string]: NetworkInfo } = {}

export const NETWORKS_INFO = new Proxy(NETWORKS_INFO_HARDCODE, {
  get(target, p) {
    const prop = p as any as ChainId
    return cacheInfo[prop] || target[prop]
  },
})

const defaultData = MAINNET_NETWORKS.map(chainId => NETWORKS_INFO_HARDCODE[chainId])

export default function useChainsConfig() {
  const { data } = useGetChainsConfigurationQuery()
  const globalConfig = useKyberswapGlobalConfig()

  return useMemo(() => {
    const hasBeConfig = !!data
    const chains: NetworkInfo[] = defaultData.map(chain => {
      const chainId = +chain.chainId as ChainId
      const chainState = hasBeConfig ? globalConfig?.chainStates?.[chainId] : ChainState.ACTIVE
      const info = {
        ...NETWORKS_INFO_HARDCODE[chainId],
        ...chain, // BE config
        chainId,
        state: chainState,
      }
      cacheInfo[chainId] = info
      return info
    })

    return {
      activeChains: chains.filter(chain => [ChainState.ACTIVE, ChainState.NEW].includes(chain.state)),
      supportedChains: chains.filter(chain =>
        [ChainState.ACTIVE, ChainState.NEW, ChainState.MAINTENANCE].includes(chain.state),
      ),
      allChains: chains,
    }
  }, [data, globalConfig])
}
