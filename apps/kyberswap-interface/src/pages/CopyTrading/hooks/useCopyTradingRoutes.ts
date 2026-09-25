import { useCallback } from 'react'

import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { getCopyTradingPath } from 'pages/CopyTrading/routing'

export const useCopyTradingRoutes = () => {
  const { chains, selectedChainId } = useCopyTradingContext()
  return useCallback(
    (path = '', chainId = selectedChainId) =>
      getCopyTradingPath(chains.find(chain => chain.chainId === chainId)?.slug || chainId, path),
    [chains, selectedChainId],
  )
}
