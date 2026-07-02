import { type Address, type Hex } from 'viem'

import {
  KyberCrossRawQuote,
  KyberCrossResponseData,
  KyberCrossTx,
} from 'pages/CrossChainSwap/adapters/KyberCrossChainAdapter/types'

export const getResponseData = (rawQuote: KyberCrossRawQuote): KyberCrossResponseData | undefined =>
  typeof rawQuote.data === 'object' ? rawQuote.data : undefined

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
