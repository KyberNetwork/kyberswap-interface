import { ChainId } from '@kyberswap/ks-sdk-core'
import { type Chain as ViemChain } from 'viem'
import { arbitrum, base, bsc, hyperEvm, mainnet } from 'viem/chains'

import { robinhood } from 'components/Web3Provider'
import type {
  BuildResult,
  ChainName,
  QuoteResponseData,
  RoutePlan,
} from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'

// Keys are chain names sent to the KyberCross API; values are Viem chain configs used for execution.
// Supported chain IDs and both lookup maps below are derived from this single configuration.
const kyberCrossChains: Record<ChainName, ViemChain & { id: ChainId }> = {
  ethereum: mainnet,
  arbitrum,
  base,
  bsc,
  robinhood,
  hyperevm: hyperEvm,
}

export const kyberCrossSupportedChains = Object.values(kyberCrossChains).map(chain => chain.id)

export const chainIdToViemChain: Record<number, ViemChain> = Object.fromEntries(
  Object.values(kyberCrossChains).map(chain => [chain.id, chain]),
)

export const chainIdToKyberCrossChainName: Partial<Record<ChainId, ChainName>> = Object.fromEntries(
  Object.entries(kyberCrossChains).map(([name, chain]) => [chain.id, name]),
)

// The aggregator supplies a route summary and a built transaction, not a rebuildable route plan.
export type KyberCrossStreamQuoteData = {
  route_plan: Pick<RoutePlan, 'id' | 'expires_at'> & {
    bridge: Pick<RoutePlan['bridge'], 'provider'> & Partial<Pick<RoutePlan['bridge'], 'metadata'>>
  }
  build: BuildResult
}

export type KyberCrossRawQuote = {
  request_id?: string
  data?: QuoteResponseData | KyberCrossStreamQuoteData
  isNativeToken?: boolean
}
