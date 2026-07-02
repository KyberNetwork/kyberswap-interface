import { type Address, type Hex } from 'viem'

import type { SwapStatus } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import type { BridgeProvider, TrackingExecution } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import {
  KyberCrossRawQuote,
  KyberCrossResponseData,
  KyberCrossTx,
} from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/types'

export const getResponseData = (rawQuote: KyberCrossRawQuote): KyberCrossResponseData | undefined =>
  rawQuote.data && typeof rawQuote.data === 'object' ? rawQuote.data : undefined

export enum NormalizedProvider {
  Across = 'across',
  Relay = 'relay',
  XyFinance = 'xyfinance',
  NearIntents = 'nearintents',
  Mayan = 'mayan',
  Symbiosis = 'symbiosis',
  Debridge = 'debridge',
  Lifi = 'lifi',
  Optimex = 'optimex',
  KyberAcross = 'kyberacross',
  KyberCross = 'kybercross',
}

const normalizedProviderMap: Record<string, NormalizedProvider> = Object.values(NormalizedProvider).reduce(
  (acc, provider) => ({ ...acc, [provider]: provider }),
  {},
)

export const normalizeProvider = (provider?: string): NormalizedProvider | undefined => {
  const normalizedProvider = provider?.toLowerCase().replace(/[\s_-]+/g, '')

  return normalizedProvider ? normalizedProviderMap[normalizedProvider] : undefined
}

const kyberCrossBridgeProviderMap: Partial<Record<NormalizedProvider, BridgeProvider>> = {
  [NormalizedProvider.Across]: 'across',
  [NormalizedProvider.Relay]: 'relay',
  [NormalizedProvider.Mayan]: 'mayan',
  [NormalizedProvider.NearIntents]: 'near_intents',
}

export const getKyberCrossBridgeProviders = (sources?: string[]): BridgeProvider[] | undefined => {
  const providers =
    sources
      ?.map(source => {
        const normalizedProvider = normalizeProvider(source)
        return normalizedProvider ? kyberCrossBridgeProviderMap[normalizedProvider] : undefined
      })
      .filter((provider): provider is BridgeProvider => !!provider) || []

  return providers.length ? providers : undefined
}

export const getRouteProvider = (rawQuote: KyberCrossRawQuote, responseData?: KyberCrossResponseData) =>
  responseData?.route_plan?.bridge?.provider ||
  responseData?.route_plan?.provider ||
  rawQuote.steps?.find(step => step.provider)?.provider

export const getKyberCrossTx = (rawQuote: KyberCrossRawQuote, responseData?: KyberCrossResponseData): KyberCrossTx =>
  responseData?.build?.tx || rawQuote.build?.tx || rawQuote.tx || (rawQuote as KyberCrossTx)

export const getKyberCrossTxData = (tx: KyberCrossTx) => {
  const to = tx.to as Address
  const txData = (typeof tx.data === 'string' ? tx.data : tx.txData) as Hex
  const value = BigInt(tx.value || '0')

  if (!to || !txData) {
    throw new Error('Missing required transaction data (to, txData)')
  }

  return { to, txData, value }
}

export const mapRouteStateToSwapStatus = (trackingExecution: TrackingExecution): SwapStatus => {
  const txHash =
    trackingExecution.dest_tx_hash || trackingExecution.route_state_details.bridge?.destination?.tx_hash || ''

  switch (trackingExecution.route_state) {
    case 'completed':
      return { txHash, status: 'Success' }
    case 'refunded':
      return { txHash, status: 'Refunded' }
    case 'failed':
      return { txHash, status: 'Failed' }
    default:
      return { txHash, status: 'Processing' }
  }
}
