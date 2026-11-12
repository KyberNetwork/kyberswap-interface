import { ChainId } from '@kyberswap/ks-sdk-core'
import type {
  BuildResult,
  ChainName,
  QuoteResponseData,
  RoutePlan,
} from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { type Chain as ViemChain } from 'viem'
import { arbitrum, base, bsc, hyperEvm, mainnet } from 'viem/chains'

import { elysium, robinhood } from 'components/Web3Provider/config'

// Keys are chain names sent to the KyberCross API; values are Viem chain configs used for execution.
// Supported chain IDs and both lookup maps below are derived from this single configuration.
const kyberCrossChains: Record<ChainName, ViemChain & { id: ChainId }> = {
  ethereum: mainnet,
  arbitrum,
  base,
  bsc,
  robinhood,
  hyperevm: hyperEvm,
  elysium,
}

export const kyberCrossSupportedChains = Object.values(kyberCrossChains).map(chain => chain.id)

export const chainIdToViemChain: Record<number, ViemChain> = Object.fromEntries(
  Object.values(kyberCrossChains).map(chain => [chain.id, chain]),
)

export const chainIdToKyberCrossChainName: Partial<Record<ChainId, ChainName>> = Object.fromEntries(
  Object.entries(kyberCrossChains).map(([name, chain]) => [chain.id, name]),
)

// Built stream routes omit the pricing metadata included in direct quotes.
export type GasDropPlan = Omit<NonNullable<RoutePlan['gas_drop_swap']>, 'metadata'> & {
  metadata?: NonNullable<RoutePlan['gas_drop_swap']>['metadata']
}

// The aggregator supplies a route summary and a built transaction, not a rebuildable route plan.
export type KyberCrossStreamQuoteData = {
  route_plan: Pick<RoutePlan, 'id' | 'tags' | 'estimated_duration_sec'> &
    Partial<Pick<RoutePlan, 'flow_type' | 'source_swap' | 'dest_swap' | 'fees'>> & {
      gas_drop_swap?: GasDropPlan
      expires_at?: string
      bridge: Pick<RoutePlan['bridge'], 'provider'> & Partial<Pick<RoutePlan['bridge'], 'metadata'>>
    }
  build: BuildResult
}

export type KyberCrossRawQuote = {
  request_id?: string
  data?: QuoteResponseData | KyberCrossStreamQuoteData
  isNativeToken?: boolean
}
