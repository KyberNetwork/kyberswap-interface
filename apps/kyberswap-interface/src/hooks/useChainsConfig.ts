import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetChainsConfigurationQuery } from 'services/ksSetting'

import { IS_TESTING_DEPLOYMENT } from 'constants/deployment'
import { MAINNET_NETWORKS, NETWORKS_INFO as NETWORKS_INFO_HARDCODE } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'

export enum ChainState {
  NEW = 'new',
  PROVISIONAL = 'provisional',
  ACTIVE = 'active',
  MAINTENANCE = 'maintained',
  TESTING = 'testing',
}

// A chain under test is fully enabled on the team's deployments, so the product can be exercised on
// it exactly as it will behave once it is switched on in production, and stays invisible on the live
// site. A state this build does not recognise falls out of both lists, which is how `inactive` works.
const ENABLED_STATES: ChainState[] = [
  ChainState.ACTIVE,
  ChainState.NEW,
  ChainState.PROVISIONAL,
  ...(IS_TESTING_DEPLOYMENT ? [ChainState.TESTING] : []),
]
const SUPPORTED_STATES: ChainState[] = [...ENABLED_STATES, ChainState.MAINTENANCE]

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
      activeChains: chains.filter(chain => ENABLED_STATES.includes(chain.state)),
      supportedChains: chains.filter(chain => SUPPORTED_STATES.includes(chain.state)),
      allChains: chains,
    }
  }, [data, globalConfig])
}
