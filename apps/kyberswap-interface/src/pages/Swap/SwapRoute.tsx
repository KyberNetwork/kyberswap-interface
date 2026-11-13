import { useEffect } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import SwapPage from 'pages/Swap/SwapPage'
import { RedirectPathToTradeNetwork } from 'pages/Swap/redirects'
import { useCurrencyFromUrl } from 'state/swap/hooks'
import { getTradeLocation, isCrossChainPair } from 'utils/swapFlow'

/**
 * The URL owns the selected pair. Deliberately omit wallet-to-URL network sync so
 * switching the connected wallet/account or its network does not reset the form.
 * The single-chain swap action requests the pair's network before approval or execution;
 * only a bare /swap route uses the wallet network to choose its initial URL.
 * Old mixed URLs are normalized without changing the selected pair.
 */
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

  return <SwapPage />
}

export default SwapRoute
