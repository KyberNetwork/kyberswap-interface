import { useEffect } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { useSyncNetworkParamWithStore } from 'hooks/web3/useSyncNetworkParamWithStore'
import SwapPage from 'pages/Swap/SwapPage'
import { RedirectPathToTradeNetwork } from 'pages/Swap/redirects'
import { useCurrencyFromUrl } from 'state/swap/hooks'
import { getTradeLocation, isCrossChainPair } from 'utils/swapFlow'

const NetworkSync = () => {
  useSyncNetworkParamWithStore()

  return null
}

/** Cross-chain URLs have no wallet-bound network path; old mixed URLs are replaced once. */
const SwapRoute = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { network } = useParams()
  const [params] = useSearchParams()
  const { inputChain, outputChain, fromCurrency, toCurrency } = useCurrencyFromUrl()

  const isCrossChain = isCrossChainPair(inputChain, outputChain)

  const needsNormalization = isCrossChain || ['from', 'to', 'tokenIn', 'tokenOut'].some(key => params.has(key))
  useEffect(() => {
    if (!needsNormalization) return
    const target = getTradeLocation(
      'swap',
      {
        fromChain: inputChain,
        toChain: outputChain,
        tokenIn: fromCurrency,
        tokenOut: toCurrency,
      },
      params,
    )

    if (location.pathname !== target.pathname || location.search !== target.search) {
      navigate({ ...target, hash: location.hash }, { replace: true })
    }
  }, [needsNormalization, inputChain, outputChain, fromCurrency, toCurrency, params, location, navigate])

  if (!isCrossChain && !network && !needsNormalization) return <RedirectPathToTradeNetwork />

  return (
    <>
      {!isCrossChain && network && !needsNormalization && <NetworkSync key={network} />}
      <SwapPage />
    </>
  )
}

export default SwapRoute
