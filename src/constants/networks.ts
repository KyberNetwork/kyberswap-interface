import { ChainId } from '@kyberswap/ks-sdk-core'
import { NetworkInfo } from './type'

import {
  ethereum,
  ropsten,
  rinkeby,
  görli,
  kovan,
  matic,
  mumbai,
  bnb,
  bnbTestnet,
  avax,
  avaxTestnet,
  fantom,
  cronos,
  cronosTestnet,
  arbitrum,
  arbitrumTestnet,
  bttc,
  velas,
  aurora,
  oasis,
  optimism,
} from './networks/index'

export const SUPPORTED_NETWORKS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.ARBITRUM,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.OASIS,
  ChainId.BTTC,
  ChainId.OPTIMISM,

  ...(process.env.REACT_APP_MAINNET_ENV === 'staging'
    ? [ChainId.ROPSTEN, ChainId.MUMBAI, ChainId.BSCTESTNET, ChainId.AVAXTESTNET, ChainId.FANTOM, ChainId.CRONOSTESTNET]
    : []),
]

export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number]

type NetToChain = { [p: string]: ChainId }

export const MAP_TOKEN_HAS_MULTI_BY_NETWORK = {
  // these network have many type of usdt, .... =>  hardcode 1 type
  avalanche: { usdt: 'usdt.e' },
  bittorrent: { usdt: 'usdt_e' },
}

export const TRUESIGHT_NETWORK_TO_CHAINID: NetToChain = {
  eth: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  avax: ChainId.AVAXMAINNET,
  polygon: ChainId.MATIC,
  fantom: ChainId.FANTOM,
  cronos: ChainId.CRONOS,
}

const NETWORKS_INFO_CONFIG: { [chain in ChainId]: NetworkInfo } = {
  [ChainId.MAINNET]: ethereum,
  [ChainId.ROPSTEN]: ropsten,
  [ChainId.RINKEBY]: rinkeby,
  [ChainId.GÖRLI]: görli,
  [ChainId.KOVAN]: kovan,
  [ChainId.MATIC]: matic,
  [ChainId.MUMBAI]: mumbai,
  [ChainId.BSCMAINNET]: bnb,
  [ChainId.BSCTESTNET]: bnbTestnet,
  [ChainId.AVAXMAINNET]: avax,
  [ChainId.AVAXTESTNET]: avaxTestnet,
  [ChainId.FANTOM]: fantom,
  [ChainId.CRONOS]: cronos,
  [ChainId.CRONOSTESTNET]: cronosTestnet,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.ARBITRUM_TESTNET]: arbitrumTestnet,
  [ChainId.BTTC]: bttc,
  [ChainId.VELAS]: velas,
  [ChainId.AURORA]: aurora,
  [ChainId.OASIS]: oasis,
  [ChainId.OPTIMISM]: optimism,
}

//this Proxy help fallback undefined ChainId by Ethereum info
export const NETWORKS_INFO = new Proxy(NETWORKS_INFO_CONFIG, {
  get(target, p) {
    const prop = (p as any) as ChainId
    if (p && target[prop]) return target[prop]
    return target[ChainId.MAINNET]
  },
})

export const ALL_SUPPORT_NETWORKS_ID = Object.values(ChainId).filter(i => typeof i !== 'string') as ChainId[]
export const SHOW_NETWORKS = [
  ChainId.MAINNET,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.ARBITRUM,
  ChainId.BTTC,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.OASIS,
  ChainId.OPTIMISM,
]

// map network to chainId, key is slug of NetworkInfo.route
export const NETWORK_TO_CHAINID: NetToChain = (Object.keys(NETWORKS_INFO_CONFIG).map(Number) as ChainId[]).reduce(
  (acc: NetToChain, key: ChainId) => {
    acc[NETWORKS_INFO[key].route] = key
    return acc
  },
  {} as NetToChain,
)
