import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import {
  arbitrum,
  avax,
  base,
  bera,
  blast,
  bnb,
  ethereum,
  etherlink,
  fantom,
  görli,
  hyperevm,
  linea,
  mantle,
  matic,
  megaeth,
  monad,
  optimism,
  plasma,
  rise,
  ronin,
  scroll,
  sonic,
  unichain,
  zksync,
} from 'constants/networks/index'
import { NetworkInfo } from 'constants/networks/type'

type NETWORKS_INFO_CONFIG_TYPE = { [chainId in ChainId]: NetworkInfo }

const NETWORKS_INFO_CONFIG: NETWORKS_INFO_CONFIG_TYPE = {
  [ChainId.MAINNET]: ethereum,
  [ChainId.GÖRLI]: görli,
  [ChainId.MATIC]: matic,
  [ChainId.BSCMAINNET]: bnb,
  [ChainId.AVAXMAINNET]: avax,
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
  [ChainId.RONIN]: ronin,
  [ChainId.UNICHAIN]: unichain,
  [ChainId.HYPEREVM]: hyperevm,
  [ChainId.PLASMA]: plasma,
  [ChainId.ETHERLINK]: etherlink,
  [ChainId.MONAD]: monad,
  [ChainId.MEGAETH]: megaeth,
  [ChainId.RISE]: rise,
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
  ChainId.RONIN,
  ChainId.UNICHAIN,
  ChainId.HYPEREVM,
  ChainId.ETHERLINK,
  ChainId.PLASMA,
  ChainId.MONAD,
  ChainId.MEGAETH,
  ChainId.RISE,
] as const

export function isSupportedChainId(chainId?: number): chainId is ChainId {
  if (!chainId) return false
  return !!(NETWORKS_INFO_CONFIG as any)[chainId]
}

export const FAUCET_NETWORKS = []

export const CLAIM_REWARDS_DATA_URL: { [chainId: number]: string } = {
  [ChainId.AVAXMAINNET]:
    'https://raw.githubusercontent.com/KyberNetwork/avax-trading-contest-reward-distribution/develop/results/reward_proof.json',
  [ChainId.MATIC]:
    'https://raw.githubusercontent.com/KyberNetwork/zkyber-reward-distribution/main/results/latest_merkle_data.json',
}

export const ELASTIC_NOT_SUPPORTED: () => { [key: string]: string } = () => ({
  [ChainId.ZKSYNC]: t`Elastic will be available soon`,
  [ChainId.BLAST]: t`Elastic is not supported on Blast. Please switch to other chains`,
})

export const CLASSIC_NOT_SUPPORTED: () => { [key: string]: string } = () => ({
  [ChainId.BASE]: t`Classic is not supported on Base. Please switch to other chains`,
  [ChainId.BLAST]: t`Classic is not supported on Blast. Please switch to other chains`,
})
