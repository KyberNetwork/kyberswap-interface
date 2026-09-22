import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import type { ChainQuoteToken } from 'services/copyTrading/types/agents'
import type { PreparedToken } from 'services/copyTrading/types/preparedActions'
import invariant from 'tiny-invariant'

import { useCopyTradingContext } from 'pages/CopyTrading/context'

export type QuoteToken = Required<Pick<PreparedToken, 'chainId' | 'address' | 'decimals'>> & PreparedToken

const FALLBACK_QUOTE_TOKENS: Partial<Record<number, ChainQuoteToken>> = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    symbol: 'USDC',
    name: 'USDC',
    iconUrl: 'https://storage.googleapis.com/ks-setting-1d682dca/755d9eee-8d2d-44b8-ad38-1f2765f036ce.png',
  },
  [ChainId.BSCMAINNET]: {
    chainId: ChainId.BSCMAINNET,
    address: '0x55d398326f99059ff775485246999027b3197955',
    decimals: 18,
    symbol: 'USDT',
    name: 'Tether USD',
    iconUrl: 'https://storage.googleapis.com/ks-setting-1d682dca/99d7ad96-73fd-44aa-9067-6acde2345f1a.png',
  },
  [ChainId.BASE]: {
    chainId: ChainId.BASE,
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
  },
  [ChainId.ROBINHOOD]: {
    chainId: ChainId.ROBINHOOD,
    address: '0x5fc5360d0400a0fd4f2af552add042d716f1d168',
    decimals: 6,
    symbol: 'USDG',
    name: 'Global Dollar',
  },
}

export const useChainQuoteToken = (chainId: number) => {
  const { chains } = useCopyTradingContext()
  const apiToken = chains.find(chain => chain.chainId === chainId)?.quoteToken
  const token = apiToken ?? FALLBACK_QUOTE_TOKENS[chainId]
  invariant(token, 'Copy Trading requires a configured quote token')

  return useMemo(() => {
    const quoteToken: QuoteToken = {
      chainId: String(chainId),
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name,
      logoUrl: token.iconUrl,
    }
    const quoteCurrency = new Token(chainId, token.address, token.decimals, token.symbol || token.address, token.name)
    return { quoteToken, quoteCurrency }
  }, [chainId, token])
}
