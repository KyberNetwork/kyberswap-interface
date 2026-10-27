import type { QuoteRequest as NearQuoteRequest } from '@defuse-protocol/one-click-sdk-typescript'
import type { Quote as MayanQuote } from '@mayanfinance/swap-sdk'
import type { getClient } from '@relayprotocol/relay-sdk'
import { z } from 'zod'

import type { AcrossSwapQuote } from 'pages/Swap/crossChain/adapters/AcrossAdapter/types'

const amount = z.string().regex(/^\d+$/)
const address = z.custom<`0x${string}`>(value => typeof value === 'string' && /^0x[\da-f]{40}$/i.test(value))
const hex = z.custom<`0x${string}`>(value => typeof value === 'string' && /^0x([\da-f]{2})*$/i.test(value))
const transactionValue = z.string().regex(/^(\d+|0x[\da-f]+)$/i)
export const evmTransactionSchema = z
  .object({ to: address, data: hex, value: transactionValue.default('0') })
  .passthrough()

export const debridgeQuoteSchema = z
  .object({
    orderId: z.string().min(1),
    // Solana data is also hex encoded; only EVM execution requires a destination address.
    tx: z.object({ data: hex }).passthrough(),
  })
  .passthrough()

export const lifiQuoteSchema = z
  .object({
    transactionRequest: z.object({ data: z.string().min(1) }).passthrough(),
  })
  .passthrough()

export const orbiterQuoteSchema = z
  .object({
    steps: z
      .array(
        z
          .object({
            action: z.string(),
            tx: z.object({ data: z.string().min(1) }).passthrough(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough()

export const optimexQuoteSchema = z
  .object({
    session_id: z.string().min(1),
    txData: z
      .object({
        deposit_address: z.string().min(1),
        payload: z.string().optional(),
        trade_id: z.string().min(1),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough()

export const xyQuoteSchema = z
  .object({
    bridgeDescription: z
      .object({
        provider: z.string(),
        srcBridgeTokenAddress: z.string(),
        dstBridgeTokenAddress: z.string(),
      })
      .passthrough(),
    srcSwapDescription: z.object({ provider: z.string() }).passthrough().nullish(),
    dstSwapDescription: z.object({ provider: z.string() }).passthrough().nullish(),
    minReceiveAmount: amount,
  })
  .passthrough()

export const kyberSwapQuoteSchema = z
  .object({
    tokenIn: z.string(),
    tokenOut: z.string(),
    amountIn: amount,
    amountOut: amount,
    route: z.array(z.array(z.object({}).passthrough())),
    rawAmountInUsd: z.string().optional(),
    rawAmountOutUsd: z.string().optional(),
  })
  .passthrough()

const nearQuoteSchema = z
  .object({
    quote: z.object({ depositAddress: z.string().nullish(), minAmountOut: amount }).passthrough(),
    quoteRequest: z
      .object({
        dry: z.boolean(),
        swapType: z.enum(['EXACT_INPUT', 'EXACT_OUTPUT']),
        slippageTolerance: z.number(),
        originAsset: z.string(),
        destinationAsset: z.string(),
        depositType: z.enum(['ORIGIN_CHAIN', 'INTENTS']),
        refundType: z.enum(['ORIGIN_CHAIN', 'INTENTS']),
        recipientType: z.enum(['DESTINATION_CHAIN', 'INTENTS']),
        amount,
        refundTo: z.string(),
        recipient: z.string(),
        deadline: z.string(),
        correlationId: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough()

export const parseNearQuote = (value: unknown) => {
  const quote = nearQuoteSchema.parse(value)
  return { ...quote, quoteRequest: quote.quoteRequest as NearQuoteRequest & { correlationId?: string } }
}

// SDK payloads contain provider-specific metadata. Check their execution envelope here,
// preserve the original payload, and let the SDK interpret its own protocol fields.
export const parseMayanQuote = (value: unknown): MayanQuote => {
  z.object({
    type: z.string().min(1),
    fromChain: z.string(),
    toChain: z.string(),
    fromToken: z.object({ contract: z.string(), decimals: z.number() }).passthrough(),
    toToken: z.object({ contract: z.string(), decimals: z.number() }).passthrough(),
    effectiveAmountIn64: amount,
    minAmountOut: z.number(),
  })
    .passthrough()
    .parse(value)
  return value as MayanQuote
}

export const parseAcrossQuote = (value: unknown): AcrossSwapQuote => {
  z.object({
    swapTx: evmTransactionSchema.extend({ chainId: z.number(), value: transactionValue.optional() }),
    checks: z.object({
      allowance: z.object({ token: z.string(), spender: z.string(), actual: amount, expected: amount }),
    }),
    steps: z.object({ bridge: z.object({}).passthrough() }).passthrough(),
  })
    .passthrough()
    .parse(value)
  return value as AcrossSwapQuote
}

type RelayQuote = Parameters<ReturnType<typeof getClient>['actions']['execute']>[0]['quote']
export const parseRelayQuote = (value: unknown): RelayQuote => {
  z.object({
    steps: z
      .array(
        z
          .object({
            id: z.string(),
            kind: z.enum(['transaction', 'signature']),
            items: z.array(
              z.discriminatedUnion('status', [
                z.object({ status: z.literal('complete') }).passthrough(),
                z.object({ status: z.literal('incomplete'), data: z.object({}).passthrough() }).passthrough(),
              ]),
            ),
          })
          .passthrough(),
      )
      .min(1),
  })
    .passthrough()
    .parse(value)
  return value as RelayQuote
}
