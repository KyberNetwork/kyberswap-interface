import type { SwapStatus } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import type { BridgeProvider, TrackingExecution } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import { normalizeAdapterName } from 'pages/CrossChainSwap/utils'

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
  const normalizedProvider = normalizeAdapterName(provider)

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
