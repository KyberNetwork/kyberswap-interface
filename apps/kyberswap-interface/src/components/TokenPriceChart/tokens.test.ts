import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { expect, it } from 'vitest'

import { PRICE_CHART_QUOTES } from 'constants/tokens'

import { getChartTokens, getCurrencyKey } from './tokens'

it('keeps identical token addresses on different chains distinct and removes each chain quote', () => {
  const address = '0x0000000000000000000000000000000000000001'
  const eth = new Token(ChainId.MAINNET, address, 18)
  const base = new Token(ChainId.BASE, address, 18)
  expect(getCurrencyKey(eth)).not.toBe(getCurrencyKey(base))
  expect(
    getChartTokens([eth, base, eth, PRICE_CHART_QUOTES[ChainId.MAINNET], PRICE_CHART_QUOTES[ChainId.BASE]]),
  ).toEqual([eth, base])
})

it('supports an explicit quote for order charts, including the usual stablecoin as base', () => {
  const quote = new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000001', 18)
  const otherChain = new Token(ChainId.BASE, quote.address, 18)
  const stable = PRICE_CHART_QUOTES[ChainId.MAINNET]
  expect(getChartTokens([stable, quote, otherChain], quote)).toEqual([stable])
})
