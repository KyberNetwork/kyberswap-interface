import { ChainId } from '@kyberswap/ks-sdk-core'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

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

export type NetToChain = { [p: string]: ChainId }

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
