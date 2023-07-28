import { ChainId, ChainType, getChainType } from '@kyberswap/ks-sdk-core'

import { SolanaNetworkInfo } from 'constants/networks/type'

import {
  arbitrum,
  aurora,
  avax,
  avaxTestnet,
  bnb,
  bnbTestnet,
  bttc,
  cronos,
  ethereum,
  fantom,
  görli,
  linea,
  lineaTestnet,
  matic,
  mumbai,
  oasis,
  optimism,
  solana,
  solanaDevnet,
  velas,
  zksync,
} from './networks/index'
import { EVMNetworkInfo } from './networks/type'

type SOLANA_NETWORK = ChainId.SOLANA | ChainId.SOLANA_DEVNET

type NETWORKS_INFO_CONFIG_TYPE = { [chainId in EVM_NETWORK]: EVMNetworkInfo } & {
  [chainId in SOLANA_NETWORK]: SolanaNetworkInfo
}
export const NETWORKS_INFO_CONFIG: NETWORKS_INFO_CONFIG_TYPE = {
  [ChainId.MAINNET]: ethereum,
  [ChainId.GÖRLI]: görli,
  [ChainId.MATIC]: matic,
  [ChainId.MUMBAI]: mumbai,
  [ChainId.BSCMAINNET]: bnb,
  [ChainId.BSCTESTNET]: bnbTestnet,
  [ChainId.AVAXMAINNET]: avax,
  [ChainId.AVAXTESTNET]: avaxTestnet,
  [ChainId.FANTOM]: fantom,
  [ChainId.CRONOS]: cronos,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.BTTC]: bttc,
  [ChainId.VELAS]: velas,
  [ChainId.AURORA]: aurora,
  [ChainId.OASIS]: oasis,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.ZKSYNC]: zksync,
  [ChainId.LINEA_TESTNET]: lineaTestnet,
  [ChainId.LINEA]: linea,
  [ChainId.SOLANA]: solana,
  [ChainId.SOLANA_DEVNET]: solanaDevnet,
} as const

//this Proxy helps fallback undefined ChainId by Ethereum info
export const NETWORKS_INFO = new Proxy(NETWORKS_INFO_CONFIG, {
  get(target, p) {
    const prop = p as any as ChainId
    if (p && target[prop]) return target[prop]
    return target[ChainId.MAINNET]
  },
})

export const SUPPORTED_NETWORKS = Object.keys(NETWORKS_INFO).map(Number) as ChainId[]

export const MAINNET_NETWORKS = [
  ChainId.MAINNET,
  ChainId.BSCMAINNET,
  ChainId.MATIC,
  ChainId.AVAXMAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.SOLANA,
  ChainId.BTTC,
  ChainId.OASIS,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.ZKSYNC,
  ChainId.LINEA,
] as const

export const EVM_NETWORKS = SUPPORTED_NETWORKS.filter(chainId => getChainType(chainId) === ChainType.EVM) as Exclude<
  ChainId,
  SOLANA_NETWORK
>[]

export type EVM_NETWORK = typeof EVM_NETWORKS[number]

export const EVM_MAINNET_NETWORKS = MAINNET_NETWORKS.filter(
  chainId => getChainType(chainId) === ChainType.EVM,
) as Exclude<typeof MAINNET_NETWORKS[number], ChainId.SOLANA>[]

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
export const WALLET_CONNECT_SUPPORTED_CHAIN_IDS = EVM_MAINNET_NETWORKS
export const WALLET_CONNECT_OPTIONAL_CHAIN_IDS = WALLET_CONNECT_SUPPORTED_CHAIN_IDS.filter(
  chain => !WALLET_CONNECT_REQUIRED_CHAIN_IDS.includes(chain),
)

export function isEVM(chainId?: ChainId): chainId is EVM_NETWORK {
  if (!chainId) return false
  const chainType = getChainType(chainId)
  return chainType === ChainType.EVM
}
export function isSolana(chainId?: ChainId): chainId is ChainId.SOLANA {
  if (!chainId) return false
  const chainType = getChainType(chainId)
  return chainType === ChainType.SOLANA
}
export function isSupportedChainId(chainId?: number): chainId is ChainId {
  if (!chainId) return false
  return !!(NETWORKS_INFO_CONFIG as any)[chainId]
}

export const FAUCET_NETWORKS = [ChainId.BTTC]
export const CHAINS_SUPPORT_NEW_POOL_FARM_API: readonly ChainId[] = [
  ChainId.MAINNET,
  // ChainId.MUMBAI,
  // ChainId.MATIC,
  // ChainId.BSCTESTNET,
  ChainId.BSCMAINNET,
  // ChainId.AVAXTESTNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.BTTC,
  ChainId.ARBITRUM,
  ChainId.AURORA,
  // ChainId.VELAS,
  // ChainId.OASIS,
  ChainId.OPTIMISM,
]

// Fee options instead of dynamic fee
export const STATIC_FEE_OPTIONS: { [chainId: number]: number[] | undefined } = {
  [ChainId.ARBITRUM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.AURORA]: [8, 10, 50, 300, 500, 1000],
  [ChainId.VELAS]: [8, 10, 50, 300, 500, 1000],
  [ChainId.OASIS]: [8, 10, 50, 300, 500, 1000],
  [ChainId.MAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.MATIC]: [8, 10, 50, 300, 500, 1000],
  [ChainId.AVAXMAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.FANTOM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.BSCMAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.CRONOS]: [8, 10, 50, 300, 500, 1000],
  [ChainId.BTTC]: [8, 10, 50, 300, 500, 1000],
  [ChainId.OPTIMISM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.GÖRLI]: [8, 10, 50, 300, 500, 1000],
  [ChainId.ZKSYNC]: [8, 10, 50, 300, 500, 1000],
  [ChainId.LINEA_TESTNET]: [8, 10, 50, 300, 500, 1000],
}

export const ONLY_STATIC_FEE_CHAINS = [
  ChainId.ARBITRUM,
  ChainId.AURORA,
  ChainId.VELAS,
  ChainId.OASIS,
  ChainId.OPTIMISM,
  ChainId.GÖRLI,
  ChainId.ZKSYNC,
  ChainId.LINEA_TESTNET,
]

// hardcode for unavailable subgraph
export const ONLY_DYNAMIC_FEE_CHAINS: ChainId[] = []

// Keys are present_on_chains' value.
export const TRENDING_SOON_SUPPORTED_NETWORKS: { [p: string]: ChainId } = {
  eth: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  polygon: ChainId.MATIC,
  avax: ChainId.AVAXMAINNET,
  fantom: ChainId.FANTOM,
}

export const CLAIM_REWARDS_DATA_URL: { [chainId: number]: string } = {
  [ChainId.AVAXMAINNET]:
    'https://raw.githubusercontent.com/KyberNetwork/avax-trading-contest-reward-distribution/develop/results/reward_proof.json',
  [ChainId.MATIC]:
    'https://raw.githubusercontent.com/KyberNetwork/zkyber-reward-distribution/main/results/latest_merkle_data.json',
  [ChainId.BTTC]:
    'https://raw.githubusercontent.com/KyberNetwork/trading-contest-reward-distribution/main/bttc/results/reward_proof.json',
}

export const DEFAULT_REWARDS: { [key: string]: string[] } = {
  [ChainId.MAINNET]: ['0x9F52c8ecbEe10e00D9faaAc5Ee9Ba0fF6550F511'],
}

export const SUPPORTED_NETWORKS_FOR_MY_EARNINGS = [
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.BTTC,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.OASIS,
]
export const COMING_SOON_NETWORKS_FOR_MY_EARNINGS: ChainId[] = []

// by pass invalid price impact/unable to calculate price impact/price impact too large
export const CHAINS_BYPASS_PRICE_IMPACT = [ChainId.LINEA_TESTNET]
