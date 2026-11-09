import { ChainId } from '@kyberswap/ks-sdk-core'

import { Chain, NonEvmChain } from 'pages/CrossChainSwap/adapters/types'

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

/**
 * Returns the list unchanged. Its type rejects a chain already in `L1_CHAINS`: one chain in both
 * groups renders two buttons sharing a `layoutId`, and one of them ends up covered and unclickable.
 */
const outsideL1 = <T extends readonly Exclude<Chain, (typeof L1_CHAINS)[number]>[]>(chains: T): T => chains

export const L2_CHAINS = outsideL1([
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
] as const)

type PlacedChain = (typeof L1_CHAINS)[number] | (typeof L2_CHAINS)[number]

/**
 * Chains the modal leaves out, by reason. With the two groups this covers every EVM and non-EVM
 * chain, so a new chain fails type-check here until it is placed in a group or listed with its reason.
 *
 * @public Read by type-check only; nothing imports it.
 */
export const UNLISTED_CHAINS: Record<Exclude<Chain, PlacedChain>, string> = {
  [ChainId.GÖRLI]: 'testnet',
}
