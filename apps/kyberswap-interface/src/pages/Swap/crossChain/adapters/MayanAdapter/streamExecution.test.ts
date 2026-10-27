import { Quote, addresses, getSwapFromEvmTxPayload } from '@mayanfinance/swap-sdk'
import { createServer } from 'node:http'
import https from 'node:https'
import { zeroAddress } from 'viem'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildEvmTransaction,
  buildEvmTransactionFromStream,
} from 'pages/Swap/crossChain/adapters/MayanAdapter/streamExecution'

const sender = '0x1111111111111111111111111111111111111111'
const bridgeInput = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
const quote = {
  type: 'SWIFT',
  fromChain: 'arbitrum',
  toChain: 'base',
  fromToken: { contract: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', decimals: 18 },
  toToken: { contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6, wChainId: 30 },
  effectiveAmountIn64: '100000000000000000',
  minAmountOut: 240,
  minMiddleAmount: 241,
  gasDrop: 0,
  deadline64: '1900000000',
  refundRelayerFee64: '12068',
  cancelRelayerFee64: '1528',
  quoteId: '0x10342681234e349bf0430205a3bb5d77',
  // Fix the random order suffix so the two encoders can be compared byte for byte.
  memoHex: '0x1234',
  swiftMayanContract: '0x40fFE85A28DC9993541449464d7529a922142960',
  swiftInputContract: bridgeInput,
  swiftInputDecimals: 6,
  swiftAuctionMode: 2,
  swiftVersion: 'V2',
  evmSwapRouterAddress: '0x57f96440f1b1cAD53B40A8924BD540b1279A491c',
  evmSwapRouterCalldata: '0x12345678',
} as Quote

// Reference SDK requests go to a local stub; no tests contact the Mayan provider.
const requests = vi.fn()
const originalPriceUrl = addresses.PRICE_URL
const server = createServer((req, res) => {
  requests(req.url)
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({ swapRouterAddress: quote.evmSwapRouterAddress, swapRouterCalldata: quote.evmSwapRouterCalldata }),
  )
})
beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing test server address')
  addresses.PRICE_URL = `http://127.0.0.1:${address.port}`
  vi.spyOn(https, 'request').mockImplementation(() => {
    throw new Error('Unexpected external HTTP request')
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Unexpected fetch')
    }),
  )
})
beforeEach(() => requests.mockClear())
afterAll(async () => {
  addresses.PRICE_URL = originalPriceUrl
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())))
})

const variants: Partial<Quote>[] = [
  { swiftVersion: 'V1' },
  { swiftVersion: 'V1', swiftInputContract: zeroAddress },
  { swiftVersion: 'V2' },
  { swiftVersion: 'V2', swiftWrapAndLock: true },
  ...[false, true].flatMap(hasAuction => [
    { type: 'MCTP' as const, hasAuction, cheaperChain: 'base' as const },
    { type: 'MCTP' as const, hasAuction, cheaperChain: 'arbitrum' as const },
    { type: 'FAST_MCTP' as const, hasAuction },
  ]),
]
const baseQuote = {
  ...quote,
  slippageBps: 50,
  bridgeFee: 0.0001,
  redeemRelayerFee: 0.01,
  mctpInputContract: bridgeInput,
  fastMctpInputContract: bridgeInput,
  mctpMayanContract: sender,
  fastMctpMayanContract: sender,
  circleMaxFee64: '1000',
  fastMctpMinFinality: 1000,
}

describe('Mayan stream-only builder', () => {
  it.each(variants.flatMap(variant => [false, true].map(native => ({ ...variant, native }))))(
    'matches stock SDK source-swap calldata/value: %j',
    async ({ native, ...variant }) => {
      const raw = {
        ...baseQuote,
        ...variant,
        fromToken: { ...quote.fromToken, contract: native ? zeroAddress : quote.fromToken.contract },
      }
      const original = structuredClone(raw)
      const actual = await buildEvmTransaction(raw, sender, sender, {}, 42161)
      expect(requests).not.toHaveBeenCalled()
      const expected = await getSwapFromEvmTxPayload(raw, sender, sender, {}, sender, 42161, null, null)
      if (native && variant.swiftInputContract === zeroAddress) {
        expect(requests).not.toHaveBeenCalled()
      } else {
        expect(requests).toHaveBeenCalledOnce()
        expect(requests.mock.calls[0][0]).toContain('/get-swap/evm?')
      }
      expect(actual.data).toBe(expected.data)
      expect(actual.to).toBe(expected.to)
      if (actual.value == null || expected.value == null) throw new Error('Missing transaction value')
      expect(BigInt(actual.value.toString())).toBe(BigInt(expected.value.toString()))
      expect(raw).toEqual(original)
    },
  )

  it.each(variants)('builds direct bridge input without HTTP: %j', async variant => {
    const raw = {
      ...baseQuote,
      ...variant,
      fromToken: { ...quote.fromToken, contract: variant.swiftInputContract ?? bridgeInput },
    }
    const actual = await buildEvmTransaction(raw, sender, sender, {}, 42161)
    const expected = await getSwapFromEvmTxPayload(raw, sender, sender, {}, sender, 42161, null, null)
    expect(actual.data).toBe(expected.data)
    expect(requests).not.toHaveBeenCalled()
  })

  it.each([
    { evmSwapRouterAddress: undefined },
    { evmSwapRouterCalldata: undefined },
    { evmSwapRouterCalldata: '0x' },
    { evmSwapRouterCalldata: 'invalid' },
    { minMiddleAmount: undefined },
    { swiftInputContract: undefined },
    { type: 'SHUTTLE' },
    { toChain: 'hypercore' },
    { type: 'MCTP', effectiveAmountIn64: '1', fromToken: { ...quote.fromToken, contract: zeroAddress } },
  ])('rejects missing/unsupported execution data before any HTTP: %j', async patch => {
    await expect(
      buildEvmTransactionFromStream({ ...baseQuote, ...patch } as Quote, sender, sender, {}, 42161),
    ).rejects.toThrow()
    expect(requests).not.toHaveBeenCalled()
  })

  it('propagates SDK fallback failures without retrying', async () => {
    await expect(
      buildEvmTransaction(
        { ...baseQuote, evmSwapRouterCalldata: undefined, minMiddleAmount: undefined },
        sender,
        sender,
        {},
        42161,
      ),
    ).rejects.toThrow()
    expect(requests).toHaveBeenCalledOnce()
  })

  it.each([
    { evmSwapRouterAddress: undefined },
    { evmSwapRouterCalldata: undefined },
    { evmSwapRouterCalldata: 'invalid' },
  ])('falls back to the original SDK when stream swap data is unusable: %j', async patch => {
    const raw = { ...baseQuote, ...patch }
    const original = structuredClone(raw)
    const actual = await buildEvmTransaction(raw, sender, sender, {}, 42161)
    expect(requests).toHaveBeenCalledOnce()
    expect(requests.mock.calls[0][0]).toContain('/get-swap/evm?')
    const expected = await getSwapFromEvmTxPayload(raw, sender, sender, {}, sender, 42161, null, null)
    expect(actual.data).toBe(expected.data)
    expect(raw).toEqual(original)
  })
})
