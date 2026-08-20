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
  CctpV2 = 'cctpv2',
  CctpV2Fast = 'cctpv2fast',
  Ccip = 'ccip',
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
  [NormalizedProvider.CctpV2]: 'cctp_v2',
  [NormalizedProvider.CctpV2Fast]: 'cctp_v2_fast',
  [NormalizedProvider.Ccip]: 'ccip',
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

const getFinalReceivedAmount = (trackingExecution: TrackingExecution): string | undefined => {
  if (trackingExecution.route_state !== 'SUCCESS') return undefined

  const details = trackingExecution.data

  return details.dest_swap?.output_amount ?? details.dest_withdraw?.withdraw_amount ?? details.bridge?.dest?.amount
}

const getFinalTxHash = (trackingExecution: TrackingExecution): string => {
  if (trackingExecution.dest_tx_hash) return trackingExecution.dest_tx_hash

  const details = trackingExecution.data
  const hasDestinationAction =
    trackingExecution.flow_type === 'bridge_then_swap' ||
    trackingExecution.flow_type === 'swap_bridge_swap' ||
    !!details.dest_swap ||
    !!details.dest_withdraw

  return hasDestinationAction ? '' : details.bridge?.dest?.tx_hash || ''
}

export const mapRouteStateToSwapStatus = (trackingExecution: TrackingExecution): SwapStatus => {
  const txHash = getFinalTxHash(trackingExecution)
  const amountOut = getFinalReceivedAmount(trackingExecution)

  switch (trackingExecution.route_state) {
    case 'SUCCESS':
      return { txHash, status: 'Success', amountOut }
    case 'REFUNDED':
      return { txHash, status: 'Refunded' }
    case 'FAILED':
      return { txHash, status: 'Failed' }
    default:
      return { txHash, status: 'Processing' }
  }
}
