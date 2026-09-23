import type { SwapStatus } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import type { BridgeProvider, RoutePlan, TrackingExecution } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import type { GasDropQuote, GasDropStatus } from 'pages/CrossChainSwap/adapters/types'
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

const getFinalReceivedAmount = (trackingExecution: TrackingExecution, hasGasDrop: boolean): string | undefined => {
  if (trackingExecution.route_state !== 'SUCCESS') return undefined

  const details = trackingExecution.data

  return (
    details.dest_swap?.output_amount ??
    details.withdraw?.withdraw_amount ??
    details.dest_withdraw?.withdraw_amount ??
    (hasGasDrop || details.gas_drop ? undefined : details.bridge?.dest?.amount)
  )
}

const getFinalTxHash = (trackingExecution: TrackingExecution, hasGasDrop: boolean): string => {
  if (trackingExecution.dest_tx_hash) return trackingExecution.dest_tx_hash

  const details = trackingExecution.data
  const hasDestinationAction =
    trackingExecution.flow_type === 'bridge_then_swap' ||
    trackingExecution.flow_type === 'swap_bridge_swap' ||
    !!details.dest_swap ||
    !!details.dest_withdraw ||
    !!details.withdraw ||
    !!details.gas_drop ||
    hasGasDrop

  return hasDestinationAction ? '' : details.bridge?.dest?.tx_hash || ''
}

export const getGasDropQuote = (route: Pick<RoutePlan, 'gas_drop_swap'>): GasDropQuote | undefined => {
  const gas = route.gas_drop_swap
  if (!gas) return undefined
  const summary = gas.metadata.route_summary
  const usd = (value: unknown) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0 ? amount : undefined
  }
  return {
    amount: gas.expected_output_amount,
    minAmount: gas.min_output_amount,
    amountUsd: usd(summary.amountOutUsd),
    inputAmountUsd: usd(summary.amountInUsd),
    inputToken: gas.token_in,
  }
}

const getGasDropStatus = (execution: TrackingExecution): GasDropStatus => {
  if (execution.data.gas_drop) return { status: 'Delivered', amount: execution.data.gas_drop.output_amount }
  if (['BRIDGE_FAILED', 'BRIDGE_EXPIRED'].includes(execution.route_state)) return { status: 'NotExecuted' }
  if (['SUCCESS', 'REFUNDED', 'FAILED'].includes(execution.route_state)) {
    const onDestination = execution.data.refund
      ? execution.data.refund.chain === execution.dest_chain
      : !!execution.data.bridge?.dest
    return { status: execution.route_state === 'SUCCESS' || onDestination ? 'Failed' : 'NotExecuted' }
  }
  return { status: 'Pending' }
}

export const mapRouteStateToSwapStatus = (trackingExecution: TrackingExecution, hasGasDrop = false): SwapStatus => {
  const txHash = getFinalTxHash(trackingExecution, hasGasDrop)
  const amountOut = getFinalReceivedAmount(trackingExecution, hasGasDrop)
  const gasStatus = hasGasDrop ? { gasDropStatus: getGasDropStatus(trackingExecution) } : {}

  switch (trackingExecution.route_state) {
    case 'SUCCESS':
      return { ...gasStatus, txHash, status: 'Success', amountOut }
    case 'REFUNDED':
      return { ...gasStatus, txHash, status: 'Refunded' }
    case 'FAILED':
      return { ...gasStatus, txHash, status: 'Failed' }
    default:
      return { ...gasStatus, txHash, status: 'Processing' }
  }
}
