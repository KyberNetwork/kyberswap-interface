import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { getPairInfo } from 'services/crossChain/quote/getPairInfo'
import { fetchTokenPrices } from 'services/tokenCatalog'
import { describe, expect, it, vi } from 'vitest'

import { NativeCurrencies } from 'constants/tokens'

vi.mock('services/tokenCatalog', () => ({
  fetchTokenPrices: vi.fn(),
  fetchTokenCategories: vi.fn(async () => []),
}))

describe('Gas Drop native token pricing', () => {
  it.each([false, true])('fetches the destination native price only for Gas Drop: %s', async gasDrop => {
    const currencyIn = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6)
    const currencyOut = new Token(ChainId.BASE, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6)
    const nativeAddress = NativeCurrencies[ChainId.BASE].wrapped.address
    vi.mocked(fetchTokenPrices).mockResolvedValue({
      data: {
        [ChainId.MAINNET]: { [currencyIn.address]: { PriceBuy: 1, PriceSell: 1 } },
        [ChainId.BASE]: {
          [currencyOut.address]: { PriceBuy: 1, PriceSell: 1 },
          [nativeAddress]: { PriceBuy: 1999, PriceSell: 2001 },
        },
      },
    })
    const signal = new AbortController().signal
    const pairInfo = await getPairInfo({
      gasDrop,
      currencyIn,
      currencyOut,
      fromChainId: ChainId.MAINNET,
      toChainId: ChainId.BASE,
      checkSameAsset: () => ({ abort: vi.fn(), unwrap: async () => true }),
      signal,
    })

    expect(fetchTokenPrices).toHaveBeenLastCalledWith(
      {
        [ChainId.MAINNET]: [currencyIn.address],
        [ChainId.BASE]: gasDrop ? [currencyOut.address, nativeAddress] : [currencyOut.address],
      },
      { signal },
    )
    expect(pairInfo).toMatchObject({ tokenInUsd: 1, tokenOutUsd: 1, gasDropTokenUsd: gasDrop ? 2000 : undefined })
  })
})
