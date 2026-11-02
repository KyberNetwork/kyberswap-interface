import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'

import { fetchAllNetworkTokenPage, isSameCurrency } from './utils'

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

describe('aggregate KS Setting requests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('omits chainIds and unsupported tags/sort, preserves query and maps the old response shape', async () => {
    const token = {
      chainId: 1,
      address: '0x0000000000000000000000000000000000000001',
      decimals: 18,
      symbol: 'TOKEN',
      name: 'Token',
      logoURI: 'logo.svg',
      permitType: 'AMOUNT',
    }
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      data: {
        code: 0,
        data: { tokens: [token, { chainId: 1, address: 'invalid', decimals: 18 }], pagination: { totalItems: 20 } },
      },
    })
    const result = await fetchAllNetworkTokenPage('USDC', 2)
    const url = new URL(get.mock.calls[0][0])
    expect(url.pathname).toBe('/api/v1/tokens')
    expect(url.searchParams.get('query')).toBe('USDC')
    expect(url.searchParams.get('page')).toBe('2')
    for (const field of ['chainIds', 'name', 'tag', 'sort']) expect(url.searchParams.has(field)).toBe(false)
    expect(result.rawCount).toBe(2)
    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0].logoURI).toBe('logo.svg')
    expect(result.tokens[0].permitType).toBe('AMOUNT')
  })
  it('uses addresses for an exact contract search and whitelist for browsing', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: { code: 0, data: { tokens: null } } })
    const address = '0x0000000000000000000000000000000000000001'
    await fetchAllNetworkTokenPage(address, 1)
    expect(new URL(get.mock.calls[0][0]).searchParams.get('addresses')).toBe(address)
    await fetchAllNetworkTokenPage('', 1)
    expect(new URL(get.mock.calls[1][0]).searchParams.get('isWhitelisted')).toBe('true')
  })
  it('surfaces API error envelopes instead of treating them as an empty list', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { code: 4004, message: 'Invalid input' } })
    await expect(fetchAllNetworkTokenPage('', 1)).rejects.toThrow('Token list request failed')
  })
})
