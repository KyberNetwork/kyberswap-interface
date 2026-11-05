import { describe, expect, it } from 'vitest'

import { type QuoteParams } from 'pages/Swap/crossChain/adapters/types'
import { normalizeStreamQuote, parseQuoteResponse } from 'pages/Swap/crossChain/quote/parseStreamQuote'
import { getMinimumOutputAmount, sortQuotesByOutput } from 'pages/Swap/crossChain/quote/utils'
import type { Quote } from 'pages/Swap/crossChain/registry'
import { type Currency, NonEvmChain } from 'types/crossChain'

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
  it('reads the PRE built KyberCross Gas Drop allocation without optional pricing metadata', () => {
    // Shape and amounts from the live 10 USDC Base -> Arbitrum response.
    const rawQuote = {
      data: {
        route_plan: {
          id: 'gas-drop-route',
          expires_at: '2026-11-05T01:21:24.019950303Z',
          bridge: { provider: 'eco' },
          gas_drop_swap: {
            token_in: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            token_out: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            input_amount: '1996081',
            expected_output_amount: '827700647002394',
            min_output_amount: '744930582302154',
          },
        },
        build: { tx: { to: params.sender, data: '0x', value: '0' } },
      },
    }
    const data = parseQuoteResponse(
      JSON.stringify({
        ...JSON.parse(event),
        provider: 'kybercross',
        outputAmount: 7926549,
        minOutputAmount: 7926549,
        rawQuote,
      }),
    )
    const quote = normalizeStreamQuote(data, { ...params, gasDrop: true })

    expect(quote.gasDrop).toEqual({
      amount: '827700647002394',
      minAmount: '744930582302154',
      inputToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      amountUsd: undefined,
      inputAmountUsd: undefined,
    })
    expect(quote.quoteParams.gasDrop).toBe(true)
    expect(quote.outputAmount).toBe(7926549n)
    expect(quote.rawQuote).toEqual(rawQuote)
    expect(quote.quoteId).toBe('aggregator-quote-123')

    const pricedQuote = normalizeStreamQuote(
      { ...data, inputUsd: 10, outputUsd: 7.926549 },
      { ...params, gasDrop: true, gasDropTokenUsd: 2400 },
    )
    expect(pricedQuote.priceImpact).toBeCloseTo(0.869694471942544, 10)
    expect(pricedQuote.outputUsd).toBe(7.926549)
  })

  it('keeps the API Gas Drop allocation on the normalized quote', () => {
    const gasDrop = { amount: '100', minAmount: '90', amountUsd: 0.1, inputToken: '0xgas' }
    const quote = normalizeStreamQuote({ ...parseQuoteResponse(event), gasDrop }, { ...params, gasDrop: true })

    expect(quote.gasDrop).toEqual(gasDrop)
    expect(quote.quoteParams.gasDrop).toBe(true)
    expect(quote.priceImpact).toBeCloseTo(0.9)
    expect(quote.outputUsd).toBe(99)
  })

  it.each([undefined, 0, NaN, Infinity])('keeps impact unknown when Gas Drop USD has no valid price: %s', price => {
    const gasDrop = { amount: '1000000000000000', minAmount: '900000000000000', inputToken: '0xgas' }
    const quote = normalizeStreamQuote(
      { ...parseQuoteResponse(event), gasDrop },
      { ...params, gasDrop: true, gasDropTokenUsd: price },
    )
    expect(quote.priceImpact).toBeNull()
    expect(quote.outputUsd).toBe(99)
  })

  it.each([0, 1])('uses API Gas Drop USD once instead of adding its native-price fallback: %s', amountUsd => {
    const gasDrop = { amount: '1000000000000000', minAmount: '900000000000000', inputToken: '0xgas', amountUsd }
    const quote = normalizeStreamQuote(
      { ...parseQuoteResponse(event), gasDrop },
      { ...params, gasDrop: true, gasDropTokenUsd: 2000 },
    )
    expect(quote.priceImpact).toBe(1 - amountUsd)
    expect(quote.outputUsd).toBe(99)
  })

  it('keeps an independent request snapshot when the caller changes its amount or sources', () => {
    const request = { ...params, includedSources: ['mayan'] }
    const quote = normalize(request)
    request.amount = '1'
    request.includedSources.push('relay')
    expect(quote.quoteParams.amount).toBe(params.amount)
    expect(quote.quoteParams.includedSources).toEqual(['mayan'])
  })

  it('preserves large JSON amounts exactly without changing SDK payload types', () => {
    const data = parseQuoteResponse(event)
    const quote = normalizeStreamQuote(data, params)

    expect(data.outputAmount).toBe('40767481736350172')
    expect(quote.outputAmount).toBe(40767481736350172n)
    expect(quote.minimumOutputAmount).toBe(40767481736350172n)
    expect(quote.rawQuote).toEqual(JSON.parse(event).rawQuote)
    expect(quote).toMatchObject({ quoteId: 'aggregator-quote-123', quoteToken: 'opaque-token' })
    expect(quote.formattedOutputAmount).toBe('0.040767481736350172')
    expect(quote.rate).toBeCloseTo(0.000407674817, 12)
  })

  it.each([
    { additionalFeeUsd: 0.3, additionalFeeAmount: '0.0001 ETH' },
    { additionalFeeUsd: 0, additionalFeeAmount: '0.0001 ETH' },
    { additionalFeeUsd: undefined, additionalFeeAmount: undefined },
  ])('preserves provider fees without inventing missing values: %j', fees => {
    expect(normalizeStreamQuote({ ...parseQuoteResponse(event), ...fees }, params)).toMatchObject(fees)
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
  ])('preserves %s decimals and wallet execution parameters', (chain, decimals, output, minimum, formatted) => {
    const data = parseQuoteResponse(event.replaceAll('40767481736350172', output))
    data.minOutputAmount = minimum
    const request = {
      ...params,
      fromChain: chain,
      toChain: chain,
      toToken: { decimals } as Currency,
      sender: 'source-wallet',
      publicKey: 'source-public-key',
    }
    const quote = normalizeStreamQuote(data, request)
    expect(quote.formattedOutputAmount).toBe(formatted)
    expect(getMinimumOutputAmount(quote)).toBe(BigInt(minimum))
    expect(quote.quoteParams).toEqual(request)
  })

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
