import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import {
  arbitrum,
  avax,
  avaxTestnet,
  base,
  bera,
  blast,
  bnb,
  bnbTestnet,
  ethereum,
  fantom,
  görli,
  linea,
  mantle,
  matic,
  mumbai,
  optimism,
  scroll,
  sonic,
  zksync,
} from './networks/index'
import { NetworkInfo } from './networks/type'

type NETWORKS_INFO_CONFIG_TYPE = { [chainId in ChainId]: NetworkInfo }

const NETWORKS_INFO_CONFIG: NETWORKS_INFO_CONFIG_TYPE = {
  [ChainId.MAINNET]: ethereum,
  [ChainId.GÖRLI]: görli,
  [ChainId.MATIC]: matic,
  [ChainId.MUMBAI]: mumbai,
  [ChainId.BSCMAINNET]: bnb,
  [ChainId.BSCTESTNET]: bnbTestnet,
  [ChainId.AVAXMAINNET]: avax,
  [ChainId.AVAXTESTNET]: avaxTestnet,
  [ChainId.FANTOM]: fantom,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.ZKSYNC]: zksync,
  [ChainId.LINEA]: linea,
  [ChainId.BASE]: base,
  [ChainId.SCROLL]: scroll,
  [ChainId.BLAST]: blast,
  [ChainId.MANTLE]: mantle,
  [ChainId.SONIC]: sonic,
  [ChainId.BERA]: bera,
} as const

//this Proxy helps fallback undefined ChainId by Ethereum info
export const NETWORKS_INFO = new Proxy(NETWORKS_INFO_CONFIG, {
  get(target, p) {
    const prop = p as any as ChainId
    if (p && target[prop]) return target[prop]
    return target[ChainId.MAINNET]
  },
})

export const SUPPORTED_NETWORKS: ChainId[] = Object.keys(NETWORKS_INFO).map(Number)

export const MAINNET_NETWORKS = [
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.LINEA,
  ChainId.MATIC,
  ChainId.ZKSYNC,
  ChainId.BASE,
  ChainId.SCROLL,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.BLAST,
  ChainId.MANTLE,
  ChainId.SONIC,
  ChainId.BERA,
] as const

// These option of walletconnect is not support by wallets properly
// E.g:
// - Zerion ios only enable those chains which we pass to `chains` option, completely ignoring `optionalChains`
// - Metamask android only accept [1], ignore `optionalChains`
// - Metamask ios not live yet as 24/6/23
// - Alpha wallet behaves like Zerion ios, but is able to edit chains list on wallet after connected.
// - Zerion android enable some chains in `optionalChains`
// - Rainbow wallet: ??
// Ideally, we would have to pass {chains: [1], optionalChains: [...rest]} to walletconnect
// But most wallets not respecting `optionalChains`, causing some inconveniences that we can only use Ethereum through Walletconnect
// Note: this const is use for wallets connecting through walletconnect, not directly through injected method
export const WALLET_CONNECT_REQUIRED_CHAIN_IDS = [ChainId.MAINNET]
export const WALLET_CONNECT_SUPPORTED_CHAIN_IDS = MAINNET_NETWORKS
export const WALLET_CONNECT_OPTIONAL_CHAIN_IDS = WALLET_CONNECT_SUPPORTED_CHAIN_IDS.filter(
  chain => !WALLET_CONNECT_REQUIRED_CHAIN_IDS.includes(chain),
)

export function isSupportedChainId(chainId?: number): chainId is ChainId {
  if (!chainId) return false
  return !!(NETWORKS_INFO_CONFIG as any)[chainId]
}

export const FAUCET_NETWORKS = []

// Fee options instead of dynamic fee
export const STATIC_FEE_OPTIONS: { [chainId: number]: number[] | undefined } = {
  [ChainId.ARBITRUM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.MAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.MATIC]: [8, 10, 50, 300, 500, 1000],
  [ChainId.AVAXMAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.FANTOM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.BSCMAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.OPTIMISM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.GÖRLI]: [8, 10, 50, 300, 500, 1000],
  [ChainId.ZKSYNC]: [8, 10, 50, 300, 500, 1000],
  [ChainId.LINEA]: [8, 10, 50, 300, 500, 1000],
  [ChainId.BASE]: [8, 10, 50, 300, 500, 1000],
  [ChainId.SCROLL]: [8, 10, 50, 300, 500, 1000],
}

export const ONLY_STATIC_FEE_CHAINS = [
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.GÖRLI,
  ChainId.ZKSYNC,
  ChainId.LINEA,
  ChainId.BASE,
  ChainId.SCROLL,
]

// hardcode for unavailable subgraph
export const ONLY_DYNAMIC_FEE_CHAINS: ChainId[] = []

export const CLAIM_REWARDS_DATA_URL: { [chainId: number]: string } = {
  [ChainId.AVAXMAINNET]:
    'https://raw.githubusercontent.com/KyberNetwork/avax-trading-contest-reward-distribution/develop/results/reward_proof.json',
  [ChainId.MATIC]:
    'https://raw.githubusercontent.com/KyberNetwork/zkyber-reward-distribution/main/results/latest_merkle_data.json',
}

export const DEFAULT_REWARDS: { [key: string]: string[] } = {
  [ChainId.MAINNET]: ['0x9F52c8ecbEe10e00D9faaAc5Ee9Ba0fF6550F511'],
}

export const SUPPORTED_NETWORKS_FOR_MY_EARNINGS = [
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.MATIC,
  ChainId.LINEA,
  ChainId.BASE,
  ChainId.ZKSYNC,
  ChainId.SCROLL,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
]
export const COMING_SOON_NETWORKS_FOR_MY_EARNINGS: ChainId[] = []
export const COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY: ChainId[] = []
export const COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC: ChainId[] = []

export const ELASTIC_NOT_SUPPORTED: () => { [key: string]: string } = () => ({
  [ChainId.ZKSYNC]: t`Elastic will be available soon`,
  [ChainId.BLAST]: t`Elastic is not supported on Blast. Please switch to other chains`,
})

export const CLASSIC_NOT_SUPPORTED: () => { [key: string]: string } = () => ({
  [ChainId.BASE]: t`Classic is not supported on Base. Please switch to other chains`,
  [ChainId.BLAST]: t`Classic is not supported on Blast. Please switch to other chains`,
})
