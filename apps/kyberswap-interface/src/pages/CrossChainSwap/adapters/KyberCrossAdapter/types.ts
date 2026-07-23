import { ChainId } from '@kyberswap/ks-sdk-core'
import { type Chain as ViemChain } from 'viem'
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

import type { ChainName, QuoteResponseData } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'

export const kyberCrossSupportedChains = [
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

export const chainIdToKyberCrossChainName: Partial<Record<ChainId, ChainName>> = {
  [ChainId.MAINNET]: 'ethereum',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.BASE]: 'base',
  [ChainId.BSCMAINNET]: 'bsc',
}

export type KyberCrossRawQuote = {
  request_id?: string
  data?: QuoteResponseData
  isNativeToken?: boolean
}
