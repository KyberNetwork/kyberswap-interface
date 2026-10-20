import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'

import { useSyncNetworkParamWithStore } from 'hooks/web3/useSyncNetworkParamWithStore'
import SwapPage from 'pages/Swap/SwapPage'
import { RedirectPathToTradeNetwork } from 'pages/Swap/redirects'
import { useCurrencyFromUrl } from 'state/swap/hooks'
import { getDefaultSwapTokenId, getTradeLocation, isCrossChainPair } from 'utils/swapFlow'

const NetworkSyncedSwap = () => {
  useSyncNetworkParamWithStore()
  return <SwapPage />
}

/** Cross-chain URLs have no wallet-bound network path; old mixed URLs are replaced once. */
const SwapRoute = () => {
  const location = useLocation()
  const { network } = useParams()
  const [params] = useSearchParams()
  const { inputChain, outputChain, fromCurrency, toCurrency } = useCurrencyFromUrl()
  const isCrossChain = isCrossChainPair(inputChain, outputChain)
  if (isCrossChain || ['from', 'to', 'tokenIn', 'tokenOut'].some(key => params.has(key))) {
    const target = getTradeLocation(
      'swap',
      {
        fromChain: inputChain,
        toChain: outputChain,
        tokenIn: fromCurrency || getDefaultSwapTokenId(inputChain),
        tokenOut: toCurrency || getDefaultSwapTokenId(outputChain),
      },
      params,
    )
    if (location.pathname !== target.pathname || location.search !== target.search) {
      return <Navigate to={{ ...target, hash: location.hash }} replace />
    }
  }
  if (isCrossChain) return <SwapPage />
  if (!network) return <RedirectPathToTradeNetwork />
  return <NetworkSyncedSwap key={network} />
}

export default SwapRoute
