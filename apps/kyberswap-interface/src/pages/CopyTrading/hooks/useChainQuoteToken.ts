import { Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import type { PreparedToken } from 'services/copyTrading/types/preparedActions'

import { useCopyTradingContext } from 'pages/CopyTrading/context'

export type QuoteToken = Required<Pick<PreparedToken, 'chainId' | 'address' | 'decimals'>> & PreparedToken

export const useChainQuoteToken = (chainId: number) => {
  const { chains } = useCopyTradingContext()
  const token = chains.find(chain => chain.chainId === chainId)?.quoteToken

  return useMemo(() => {
    const quoteToken: QuoteToken | undefined = token
      ? { ...token, chainId: String(token.chainId), logoUrl: token.iconUrl }
      : undefined
    const quoteCurrency = token
      ? new Token(chainId, token.address, token.decimals, token.symbol || token.address, token.name)
      : undefined

    return { quoteToken, quoteCurrency }
  }, [chainId, token])
}
