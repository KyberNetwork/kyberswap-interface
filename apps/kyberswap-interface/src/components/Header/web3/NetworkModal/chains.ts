import { ChainId } from '@kyberswap/ks-sdk-core'

import { NonEvmChain } from 'pages/CrossChainSwap/adapters/types'

// The modal's two groups, in display order.
export const L1_CHAINS = [
  ChainId.MAINNET,
  NonEvmChain.Bitcoin,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  NonEvmChain.Near,
  NonEvmChain.Solana,
  ChainId.BERA,
  ChainId.SONIC,
  ChainId.RONIN,
  ChainId.FANTOM,
  ChainId.HYPEREVM,
  ChainId.PLASMA,
  ChainId.MONAD,
  ChainId.ARC,
] as const

export const L2_CHAINS = [
  ChainId.BASE,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.MATIC,
  ChainId.UNICHAIN,
  ChainId.LINEA,
  ChainId.ZKSYNC,
  ChainId.SCROLL,
  ChainId.BLAST,
  ChainId.ABSTRACT,
  ChainId.MANTLE,
  ChainId.ETHERLINK,
  ChainId.MEGAETH,
  ChainId.ROBINHOOD,
  ChainId.RISE,
  ChainId.ELYSIUM,
] as const

type PlacedChain = (typeof L1_CHAINS)[number] | (typeof L2_CHAINS)[number]

/**
 * Chains the modal leaves out, by reason. With the two groups this covers every `ChainId`, so a new
 * chain fails type-check here until it is placed in a group or listed with its reason.
 */
export const UNLISTED_CHAINS: Record<Exclude<ChainId, PlacedChain>, string> = {
  [ChainId.GÖRLI]: 'testnet',
}
