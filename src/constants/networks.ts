import { ChainId, ChainType, getChainType } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { SolanaNetworkInfo } from 'constants/networks/type'

import {
  arbitrum,
  aurora,
  avax,
  avaxTestnet,
  base,
  bnb,
  bnbTestnet,
  bttc,
  cronos,
  ethereum,
  fantom,
  görli,
  linea,
  matic,
  mumbai,
  optimism,
  solana,
  solanaDevnet,
  zkEvm,
  zksync,
} from './networks/index'
import { EVMNetworkInfo } from './networks/type'

type SOLANA_NETWORK = ChainId.SOLANA | ChainId.SOLANA_DEVNET

type NETWORKS_INFO_CONFIG_TYPE = { [chainId in EVM_NETWORK]: EVMNetworkInfo } & {
  [chainId in SOLANA_NETWORK]: SolanaNetworkInfo
}
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
  [ChainId.CRONOS]: cronos,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.BTTC]: bttc,
  [ChainId.AURORA]: aurora,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.ZKSYNC]: zksync,
  [ChainId.LINEA]: linea,
  [ChainId.ZKEVM]: zkEvm,
  [ChainId.BASE]: base,
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

// temporary disable Solana
// todo: either enable back or completely remove Solana from codebase
export const SUPPORTED_NETWORKS = Object.keys(NETWORKS_INFO).map(Number).filter(isEVM)

export const MAINNET_NETWORKS = [
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.LINEA,
  ChainId.MATIC,
  ChainId.ZKEVM,
  ChainId.ZKSYNC,
  ChainId.BASE,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  // ChainId.SOLANA,
  ChainId.FANTOM,
  ChainId.BTTC,
  ChainId.CRONOS,
  ChainId.AURORA,
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

// Fee options instead of dynamic fee
export const STATIC_FEE_OPTIONS: { [chainId: number]: number[] | undefined } = {
  [ChainId.ARBITRUM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.AURORA]: [8, 10, 50, 300, 500, 1000],
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
  [ChainId.LINEA]: [8, 10, 50, 300, 500, 1000],
  [ChainId.ZKEVM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.BASE]: [8, 10, 50, 300, 500, 1000],
}

export const ONLY_STATIC_FEE_CHAINS = [
  ChainId.ARBITRUM,
  ChainId.AURORA,
  ChainId.OPTIMISM,
  ChainId.GÖRLI,
  ChainId.ZKSYNC,
  ChainId.LINEA,
  ChainId.ZKEVM,
  ChainId.BASE,
]

// hardcode for unavailable subgraph
export const ONLY_DYNAMIC_FEE_CHAINS: ChainId[] = []

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
  ChainId.AURORA,
]
export const COMING_SOON_NETWORKS_FOR_MY_EARNINGS: ChainId[] = []
export const COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY: ChainId[] = []
export const COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC: ChainId[] = [ChainId.CRONOS, ChainId.AURORA]
export const BLOCTO_SUPPORTED_NETWORKS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
]

export const ELASTIC_NOT_SUPPORTED: { [key: string]: string } = {
  [ChainId.AURORA]: t`Elastic is not supported on Aurora. Please switch to other chains`,
  [ChainId.ZKSYNC]: t`Elastic will be available soon`,
}

export const CLASSIC_NOT_SUPPORTED: { [key: string]: string } = {
  [ChainId.BASE]: t`Classic is not supported on Base. Please switch to other chains`,
}
