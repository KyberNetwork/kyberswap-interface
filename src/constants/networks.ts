import { ChainId } from '@kyberswap/ks-sdk-core'
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'

import ethereumInfo from './networks/ethereum'
import ropstenInfo from './networks/ropsten'
import rinkebyInfo from './networks/rinkeby'
import görliInfo from './networks/görliInfo'
import kovanInfo from './networks/kovan'
import maticInfo from './networks/matic'
import mumbaiInfo from './networks/mumbai'
import bnbInfo from './networks/bnb'
import bnbTestnetInfo from './networks/bnb-testnet'
import avaxInfo from './networks/avax'
import avaxTestnetInfo from './networks/avax-testnet'
import fantomInfo from './networks/fantom'
import cronosInfo from './networks/cronos'
import cronosTestnetInfo from './networks/cronos-testnet'
import arbitrumInfo from './networks/arbitrum'
import arbitrumTestnetInfo from './networks/arbitrum-testnet'
import bttcInfo from './networks/bttc'
import velasInfo from './networks/velas'
import auroraInfo from './networks/aurora'
import oasisInfo from './networks/oasis'
import optimismInfo from './networks/optimism'

export const createClient = (url: string): ApolloClient<NormalizedCacheObject> =>
  new ApolloClient({
    uri: url,
    cache: new InMemoryCache(),
  })

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

export type NetworkInfo = {
  readonly chainId: ChainId
  readonly route: string
  readonly name: string
  readonly icon: string
  readonly classicClient: ApolloClient<NormalizedCacheObject>
  readonly elasticClient: ApolloClient<NormalizedCacheObject>
  readonly blockClient: ApolloClient<NormalizedCacheObject>
  readonly etherscanUrl: string
  readonly etherscanName: string
  readonly tokenListUrl: string
  readonly bridgeURL: string
  readonly nativeToken: {
    readonly symbol: string
    readonly name: string
    readonly address: string
    readonly logo: string
    readonly decimal: number
  }
  readonly rpcUrl: string
  readonly routerUri: string
  readonly classic: {
    readonly zap: string
    readonly router: string
    readonly routerV2: string //todo: remove in future
    readonly aggregationExecutor: string //todo: remove in future
    readonly factory: string
    readonly migrate: string
    readonly claimReward: string
    readonly fairlaunch: string[]
    readonly fairlaunchV2: string[]
  }
  readonly elastic: {
    readonly coreFactory: string
    readonly nonfungiblePositionManager: string
    readonly tickReader: string
    readonly initCodeHash: string
    readonly quoter: string
    readonly routers: string
  }
  // token: {
  //   DAI: Token
  //   USDC: Token
  //   USDT: Token
  // }
  readonly avgrageBlockTimeInSeconds: number
  readonly coingeckoNetworkId: string //https://api.coingecko.com/api/v3/asset_platforms
  readonly coingeckoNativeTokenId: string //https://api.coingecko.com/api/v3/coins/list
}

const NETWORKS_INFO_CONFIG: { [chain in ChainId]: NetworkInfo } = {
  [ChainId.MAINNET]: ethereumInfo,
  [ChainId.ROPSTEN]: ropstenInfo,
  [ChainId.RINKEBY]: rinkebyInfo,
  [ChainId.GÖRLI]: görliInfo,
  [ChainId.KOVAN]: kovanInfo,
  [ChainId.MATIC]: maticInfo,
  [ChainId.MUMBAI]: mumbaiInfo,
  [ChainId.BSCMAINNET]: bnbInfo,
  [ChainId.BSCTESTNET]: bnbTestnetInfo,
  [ChainId.AVAXMAINNET]: avaxInfo,
  [ChainId.AVAXTESTNET]: avaxTestnetInfo,
  [ChainId.FANTOM]: fantomInfo,
  [ChainId.CRONOS]: cronosInfo,
  [ChainId.CRONOSTESTNET]: cronosTestnetInfo,
  [ChainId.ARBITRUM]: arbitrumInfo,
  [ChainId.ARBITRUM_TESTNET]: arbitrumTestnetInfo,
  [ChainId.BTTC]: bttcInfo,
  [ChainId.VELAS]: velasInfo,
  [ChainId.AURORA]: auroraInfo,
  [ChainId.OASIS]: oasisInfo,
  [ChainId.OPTIMISM]: optimismInfo,
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
