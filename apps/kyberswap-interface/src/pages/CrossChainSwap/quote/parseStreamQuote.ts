import { ChainId } from '@kyberswap/ks-sdk-core'
import { parse } from 'lossless-json'
import { formatUnits } from 'viem'
import { z } from 'zod'

import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NonEvmChain, type NormalizedQuote, type QuoteParams } from 'pages/CrossChainSwap/adapters/types'
import { normalizeQuote } from 'pages/CrossChainSwap/quote/normalizeQuote'

export type StreamQuoteResponse = {
  provider: string
  outputAmount: string
  minOutputAmount: string
  inputUsd: number
  outputUsd: number
  additionalFeeUsd?: number
  additionalFeeAmount?: string | number
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

// KyberCross returns raw fee amounts; bridge metadata identifies the fee asset.
// Do not infer fee decimals from the input token (which may be an ERC-20).
const kyberCrossAdditionalFeesSchema = z.object({
  data: z.object({
    route_plan: z.object({
      bridge: z.object({
        additional_fees: z.array(
          z.object({
            chain: z.string(),
            token: z.string(),
            token_decimals: z.number().int().min(0).max(255),
            amount: z.string().regex(/^\d+$/),
          }),
        ),
      }),
    }),
  }),
})

const getAdditionalFeeAmount = (data: StreamQuoteResponse, params: QuoteParams): string | undefined => {
  if (data.provider.toLowerCase() === 'kybercross') {
    const result = kyberCrossAdditionalFeesSchema.safeParse(data.rawQuote)
    const network = NETWORKS_INFO[params.fromChain as ChainId]
    if (result.success) {
      const fees = result.data.data.route_plan.bridge.additional_fees
      if (
        fees.length &&
        fees.every(
          fee =>
            fee.chain === network.route &&
            [ETHER_ADDRESS.toLowerCase(), ZERO_ADDRESS].includes(fee.token.toLowerCase()) &&
            fee.token_decimals === network.nativeToken.decimal,
        )
      ) {
        const amount = fees.reduce((sum, fee) => sum + BigInt(fee.amount), 0n)
        return `${formatUnits(amount, network.nativeToken.decimal)} ${network.nativeToken.symbol}`
      }
    }
    // A numeric/raw amount without asset metadata is not a display amount.
    return typeof data.additionalFeeAmount === 'string' && !/^\d+$/.test(data.additionalFeeAmount)
      ? data.additionalFeeAmount
      : undefined
  }
  return typeof data.additionalFeeAmount === 'string' ? data.additionalFeeAmount : undefined
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
    additionalFeeAmount: getAdditionalFeeAmount(data, params),
    timeEstimate: data.timeEstimate,
    contractAddress: data.contractAddress,
    rawQuote: data.rawQuote,
    platformFeePercent: getPlatformFeePercent(data, params),
  })
}
