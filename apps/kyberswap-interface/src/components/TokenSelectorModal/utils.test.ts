import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import * as tokenCatalog from 'services/tokenCatalog'
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
})

describe('aggregate public token catalog requests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('requests verified ERC20 tokens with market-cap ranking without chainIds and maps public catalog metadata', async () => {
    const token = {
      chainId: '1',
      address: '0x0000000000000000000000000000000000000001',
      decimals: 18,
      symbol: 'TOKEN',
      name: 'Token',
      logoURL: 'logo.svg',
      id: 1,
    }
    const get = vi.spyOn(tokenCatalog, 'fetchTokenCatalogTokens').mockResolvedValue({
      data: { tokens: [token, { ...token, address: 'invalid' }], pagination: { totalItems: 20 } },
    })
    const result = await fetchAllNetworkTokenPage('USDC', 2)
    expect(get).toHaveBeenCalledWith({
      name: 'USDC',
      symbol: 'USDC',
      isVerified: true,
      tokenTypes: 'erc20',
      sort: 'marketCap:desc',
      page: 2,
      pageSize: 20,
    })
    expect(result.rawCount).toBe(2)
    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0].logoURI).toBe('logo.svg')
    expect(result.tokens[0].chainId).toBe(1)
  })
  it('keeps verified ERC20 filters for both address search and browsing', async () => {
    const get = vi.spyOn(tokenCatalog, 'fetchTokenCatalogTokens').mockResolvedValue({ data: { tokens: [] } })
    const address = '0x0000000000000000000000000000000000000001'
    await fetchAllNetworkTokenPage(address, 1)
    expect(get.mock.calls[0][0]).toEqual({
      addresses: address,
      isVerified: true,
      tokenTypes: 'erc20',
      sort: 'marketCap:desc',
      page: 1,
      pageSize: 20,
    })
    await fetchAllNetworkTokenPage('', 1)
    expect(get.mock.calls[1][0]).toEqual({
      isVerified: true,
      tokenTypes: 'erc20',
      sort: 'marketCap:desc',
      page: 1,
      pageSize: 20,
    })
  })
  it('surfaces API error envelopes instead of treating them as an empty list', async () => {
    vi.spyOn(tokenCatalog, 'fetchTokenCatalogTokens').mockResolvedValue({} as tokenCatalog.TokenCatalogListResponse)
    await expect(fetchAllNetworkTokenPage('', 1)).rejects.toThrow('Token list request failed')
  })
})
