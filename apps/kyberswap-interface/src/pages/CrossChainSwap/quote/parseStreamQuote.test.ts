import { describe, expect, it } from 'vitest'

import { type Currency, NonEvmChain, type QuoteParams } from 'pages/CrossChainSwap/adapters/types'
import { normalizeStreamQuote, parseQuoteResponse } from 'pages/CrossChainSwap/quote/parseStreamQuote'
import { getMinimumOutputAmount, sortQuotesByOutput } from 'pages/CrossChainSwap/quote/utils'
import type { Quote } from 'pages/CrossChainSwap/registry'

const params: QuoteParams = {
  feeBps: 10,
  fromChain: 1,
  toChain: 8453,
  fromToken: { decimals: 6, symbol: 'USDC' } as Currency,
  toToken: { decimals: 18, symbol: 'ETH' } as Currency,
  amount: '100000000',
  slippage: 50,
  tokenInUsd: 1,
  tokenOutUsd: 0,
  sender: '0x1111111111111111111111111111111111111111',
  recipient: '0x2222222222222222222222222222222222222222',
}

// Raw JSON numbers taken from PRE; JSON.stringify would round them before the test runs.
const event = `{
  "provider": "debridge",
  "quoteId": "aggregator-quote-123",
  "quoteToken": "opaque-token",
  "outputAmount": 40767481736350172,
  "minOutputAmount": 40767481736350172,
  "inputUsd": 100,
  "outputUsd": 99,
  "timeEstimate": 2,
  "contractAddress": "0x3333333333333333333333333333333333333333",
  "quoteParams": {"amount":"1","slippage":9999,"recipient":"wrong","feeBps":99},
  "rawQuote": {"tx":{"value":"0","data":"0x"},"slippage":50,"amount":100,"outputAmount":42}
}`

const normalize = (request = params) => normalizeStreamQuote(parseQuoteResponse(event), request)

describe('aggregator quote response', () => {
  it('keeps a frozen request snapshot when the caller changes its amount or sources', () => {
    const request = { ...params, includedSources: ['mayan'] }
    const quote = normalize(request)
    request.amount = '1'
    request.includedSources.push('relay')
    expect(quote.quoteParams.amount).toBe(params.amount)
    expect(quote.quoteParams.includedSources).toEqual(['mayan'])
    expect(Object.isFrozen(quote.quoteParams)).toBe(true)
  })

  it('preserves large JSON amounts exactly without changing SDK payload types', () => {
    const data = parseQuoteResponse(event)
    const quote = normalizeStreamQuote(data, params)

    expect(data.outputAmount).toBe('40767481736350172')
    expect(quote.outputAmount).toBe(40767481736350172n)
    expect(quote.minimumOutputAmount).toBe(40767481736350172n)
    expect(quote.rawQuote).toEqual(JSON.parse(event).rawQuote)
    expect(quote.rawQuote).toMatchObject({ slippage: 50 })
    expect(quote.formattedOutputAmount).toBe('0.040767481736350172')
    expect(quote.rate).toBeCloseTo(0.000407674817, 12)
  })

  it('preserves the exact aggregator identity through normalization', () => {
    const quote = normalize()
    expect(quote.quoteId).toBe('aggregator-quote-123')
    expect(quote.quoteToken).toBe('opaque-token')
  })

  it('preserves both additional fee fields from the response', () => {
    const data = parseQuoteResponse(
      event.replace(
        '"timeEstimate": 2',
        '"timeEstimate": 2, "additionalFeeUsd": 0.3, "additionalFeeAmount": "0.0001 ETH"',
      ),
    )
    expect(normalizeStreamQuote(data, params)).toMatchObject({
      additionalFeeUsd: 0.3,
      additionalFeeAmount: '0.0001 ETH',
    })
  })

  it('preserves the token amount fallback when the USD fee is zero', () => {
    const quote = normalizeStreamQuote(
      { ...parseQuoteResponse(event), additionalFeeUsd: 0, additionalFeeAmount: '0.0001 ETH' },
      params,
    )
    expect(quote.additionalFeeUsd).toBe(0)
    expect(quote.additionalFeeAmount).toBe('0.0001 ETH')
  })

  it('leaves additional fees absent when the API omits them', () => {
    const quote = normalize()
    expect(quote.additionalFeeUsd).toBeUndefined()
    expect(quote.additionalFeeAmount).toBeUndefined()
  })

  it('uses the request snapshot even when response quoteParams disagrees', () => {
    const quote = normalize()
    expect(quote.quoteParams).toEqual(params)
    expect(quote.quoteParams).not.toBe(params)
    expect(quote.platformFeePercent).toBe(0.1)
    expect(quote.priceImpact).toBe(1)
  })

  it('uses the provider minimum instead of applying slippage again', () => {
    const quote = normalize()
    expect(getMinimumOutputAmount(quote)).toBe(quote.outputAmount)
    expect(getMinimumOutputAmount({ ...quote, minimumOutputAmount: 0n })).toBe(0n)
  })

  it('calculates the minimum for a local same-chain quote from its request slippage', () => {
    const quote = { ...normalize(), minimumOutputAmount: undefined }
    expect(getMinimumOutputAmount(quote)).toBe((quote.outputAmount * 9950n) / 10000n)
  })

  it.each([
    [NonEvmChain.Solana, 9, '943884970', '939165545', '0.94388497'],
    [NonEvmChain.Bitcoin, 8, '118550', '117367', '0.0011855'],
    [NonEvmChain.Near, 24, '12345678901234567890123456', '12000000000000000000000000', '12.345678901234567890123456'],
  ])('normalizes %s output with its token decimals', (chain, decimals, output, minimum, formatted) => {
    const data = parseQuoteResponse(event.replaceAll('40767481736350172', output))
    data.minOutputAmount = minimum
    const request = { ...params, toChain: chain, toToken: { decimals } as Currency }
    const quote = normalizeStreamQuote(data, request)
    expect(quote.formattedOutputAmount).toBe(formatted)
    expect(getMinimumOutputAmount(quote)).toBe(BigInt(minimum))
    expect(quote.quoteParams.toChain).toBe(chain)
  })

  it.each([NonEvmChain.Solana, NonEvmChain.Near, NonEvmChain.Bitcoin])(
    'keeps the %s source wallet and execution parameters from the request',
    chain => {
      const request = { ...params, fromChain: chain, sender: 'source-wallet', publicKey: 'source-public-key' }
      expect(normalize(request).quoteParams).toEqual(request)
    },
  )

  it('accepts string amounts too', () => {
    const data = parseQuoteResponse(event.replaceAll('40767481736350172', '"40767481736350172"'))
    expect(normalizeStreamQuote(data, params).outputAmount).toBe(40767481736350172n)
  })

  it.each([0, NaN, Infinity])('treats missing or invalid input USD (%s) as unknown impact', inputUsd => {
    const quote = normalizeStreamQuote({ ...parseQuoteResponse(event), inputUsd }, params)
    expect(quote.priceImpact).toBeNull()
  })

  it('preserves the backend fee exemptions for Mayan MCTP and Socket Bitcoin-origin routes', () => {
    const data = parseQuoteResponse(event)
    expect(
      normalizeStreamQuote({ ...data, provider: 'mayan', rawQuote: { type: 'MCTP' } }, params).platformFeePercent,
    ).toBe(0)
    expect(
      normalizeStreamQuote({ ...data, provider: 'mayan', rawQuote: { type: 'SWIFT' } }, params).platformFeePercent,
    ).toBe(0.1)
    expect(
      normalizeStreamQuote({ ...data, provider: 'socket' }, { ...params, fromChain: NonEvmChain.Bitcoin })
        .platformFeePercent,
    ).toBe(0)
    expect(normalizeStreamQuote({ ...data, provider: 'socket' }, params).platformFeePercent).toBe(0.1)
  })

  it('preserves a valid zero price impact', () => {
    expect(normalizeStreamQuote({ ...parseQuoteResponse(event), outputUsd: 100 }, params).priceImpact).toBe(0)
  })

  it('rejects a missing or invalid provider minimum', () => {
    for (const minOutputAmount of [undefined, '-1', '999999999999999999']) {
      expect(() => normalizeStreamQuote({ ...parseQuoteResponse(event), minOutputAmount } as never, params)).toThrow()
    }
  })

  it('ranks by output without subtracting additional fee data', () => {
    const lower = { quote: { ...normalize(), outputAmount: 100n, additionalFeeUsd: 0 } } as Quote
    const higher = { quote: { ...normalize(), outputAmount: 101n, additionalFeeUsd: 999 } } as Quote
    const quotes = [lower, higher]
    expect(sortQuotesByOutput(quotes)).toEqual([higher, lower])
    expect(quotes).toEqual([lower, higher])
  })
})
