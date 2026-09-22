import { Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import type { PreparedToken } from 'services/copyTrading/types/preparedActions'
import invariant from 'tiny-invariant'

import { useCopyTradingContext } from 'pages/CopyTrading/context'

export type QuoteToken = Required<Pick<PreparedToken, 'chainId' | 'address' | 'decimals'>> & PreparedToken

export const useChainQuoteToken = (chainId: number) => {
  const { chains } = useCopyTradingContext()
  // Only catalog-validated chains enter the Copy Trading provider.
  const chain = chains.find(chain => chain.chainId === chainId)
  invariant(chain, 'Copy Trading requires a catalog chain')
  const token = chain.quoteToken

  return useMemo(() => {
    const quoteToken: QuoteToken = { ...token, chainId: String(token.chainId), logoUrl: token.iconUrl }
    const quoteCurrency = new Token(chainId, token.address, token.decimals, token.symbol || token.address, token.name)
    return { quoteToken, quoteCurrency }
  }, [chainId, token])
}
