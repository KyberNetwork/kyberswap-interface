import { ChainId } from '@kyberswap/ks-sdk-core'
import { type Hex, type Chain as ViemChain } from 'viem'
import {
  arbitrum,
  base,
  blast,
  bsc,
  linea,
  mainnet,
  monad,
  optimism,
  plasma,
  polygon,
  scroll,
  unichain,
  zksync,
} from 'viem/chains'

export const KYBERSWAP_INTEGRATOR_ID: Hex = '0x008a'

export const kyberAcrossSupportedChains = [
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.LINEA,
  ChainId.MATIC,
  ChainId.ZKSYNC,
  ChainId.BASE,
  ChainId.SCROLL,
  ChainId.BLAST,
  ChainId.UNICHAIN,
  ChainId.BSCMAINNET,
  ChainId.PLASMA,
  ChainId.MONAD,
]

export const kyberAcrossViemChains = [
  mainnet,
  arbitrum,
  bsc,
  optimism,
  linea,
  polygon,
  zksync,
  base,
  scroll,
  blast,
  unichain,
  plasma,
  monad,
]

export const chainIdToViemChain: Record<number, ViemChain> = {
  [ChainId.MAINNET]: mainnet,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.BSCMAINNET]: bsc,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.LINEA]: linea,
  [ChainId.MATIC]: polygon,
  [ChainId.ZKSYNC]: zksync,
  [ChainId.BASE]: base,
  [ChainId.SCROLL]: scroll,
  [ChainId.BLAST]: blast,
  [ChainId.UNICHAIN]: unichain,
  [ChainId.PLASMA]: plasma,
  [ChainId.MONAD]: monad,
}
