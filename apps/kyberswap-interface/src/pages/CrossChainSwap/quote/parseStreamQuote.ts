import { parse } from 'lossless-json'

import { NonEvmChain, type NormalizedQuote, type QuoteParams } from 'pages/CrossChainSwap/adapters/types'
import { normalizeQuote } from 'pages/CrossChainSwap/quote/normalizeQuote'

export type StreamQuoteResponse = {
  provider: string
  outputAmount: string
  minOutputAmount: string
  inputUsd: number
  outputUsd: number
  additionalFeeUsd?: number
  additionalFeeAmount?: string
  timeEstimate: number
  contractAddress: string
  rawQuote: unknown
}

export const parseQuoteResponse = (text: string): StreamQuoteResponse => {
  // PRE serializes raw amounts as JSON numbers, including values above MAX_SAFE_INTEGER.
  // Read their original digits while keeping the provider payload's existing JSON types for SDKs.
  const amounts = parse(text, undefined, value => value) as Pick<
    StreamQuoteResponse,
    'outputAmount' | 'minOutputAmount'
  >
  return {
    ...JSON.parse(text),
    outputAmount: amounts.outputAmount,
    minOutputAmount: amounts.minOutputAmount,
  }
}

const getPlatformFeePercent = (data: StreamQuoteResponse, params: QuoteParams) => {
  const provider = data.provider.toLowerCase()
  const isMayanMctp =
    provider === 'mayan' &&
    data.rawQuote !== null &&
    typeof data.rawQuote === 'object' &&
    'type' in data.rawQuote &&
    data.rawQuote.type === 'MCTP'
  const isSocketBitcoinOrigin = provider === 'socket' && params.fromChain === NonEvmChain.Bitcoin
  return isMayanMctp || isSocketBitcoinOrigin ? 0 : params.feeBps / 100
}

export const normalizeStreamQuote = (data: StreamQuoteResponse, params: QuoteParams): NormalizedQuote => {
  const outputAmount = BigInt(data.outputAmount)
  const minOutputAmount = BigInt(data.minOutputAmount)
  if (outputAmount < 0n || minOutputAmount < 0n || minOutputAmount > outputAmount) {
    throw new Error('Invalid quote output amounts')
  }

  return normalizeQuote({
    // The request snapshot owns execution parameters; response quoteParams is intentionally ignored.
    quoteParams: { ...params },
    outputAmount,
    minimumOutputAmount: minOutputAmount,
    inputUsd: data.inputUsd,
    outputUsd: data.outputUsd,
    additionalFeeUsd: data.additionalFeeUsd,
    additionalFeeAmount: data.additionalFeeAmount,
    timeEstimate: data.timeEstimate,
    contractAddress: data.contractAddress,
    rawQuote: data.rawQuote,
    platformFeePercent: getPlatformFeePercent(data, params),
  })
}
