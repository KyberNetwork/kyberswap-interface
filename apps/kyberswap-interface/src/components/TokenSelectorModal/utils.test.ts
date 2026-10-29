import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'

import { isSameCurrency } from './utils'

describe('selector currency identity', () => {
  it.each([ChainId.ROBINHOOD, ChainId.BSCMAINNET])(
    'selects the native placeholder row on chain %s without selecting wrapped native',
    chainId => {
      const native = NativeCurrencies[chainId]
      const row = new Token(chainId, ETHER_ADDRESS, native.decimals, native.symbol)

      expect(isSameCurrency(native, row)).toBe(true)
      expect(isSameCurrency(row, native)).toBe(true)
      expect(isSameCurrency(native, native)).toBe(true)
      expect(isSameCurrency(native, WETH[chainId])).toBe(false)
      expect(isSameCurrency(row, WETH[chainId])).toBe(false)
    },
  )

  it('requires matching chains and a selected currency', () => {
    const native = NativeCurrencies[ChainId.ROBINHOOD]
    expect(isSameCurrency(native, NativeCurrencies[ChainId.MAINNET])).toBe(false)
    expect(isSameCurrency(native, new Token(ChainId.MAINNET, ETHER_ADDRESS, 18))).toBe(false)
    expect(isSameCurrency(undefined, native)).toBe(false)
    expect(isSameCurrency(null, native)).toBe(false)
  })

  it('keeps matching ordinary tokens by chain and address', () => {
    const wrapped = WETH[ChainId.ROBINHOOD]
    const sameToken = new Token(wrapped.chainId, wrapped.address.toLowerCase(), wrapped.decimals)
    expect(isSameCurrency(wrapped, sameToken)).toBe(true)
  })
})
