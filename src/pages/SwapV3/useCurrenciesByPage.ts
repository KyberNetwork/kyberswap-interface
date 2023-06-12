import { stringify } from 'querystring'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useCrossChainState } from 'state/crossChain/hooks'
import { useLimitState } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { currencyId } from 'utils/currencyId'

const useCurrenciesByPage = () => {
  const { pathname } = useLocation()
  const { networkInfo, chainId } = useActiveWeb3React()
  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN)

  const currencyInSwap = useInputCurrency()
  const currencyOutSwap = useOutputCurrency()
  const limitState = useLimitState()
  const [crossChainState] = useCrossChainState()

  const currencyIn = isSwapPage ? currencyInSwap : isCrossChainPage ? crossChainState.currencyIn : limitState.currencyIn
  const currencyOut = isSwapPage
    ? currencyOutSwap
    : isCrossChainPage
    ? crossChainState.currencyOut
    : limitState.currencyOut

  const currencies = useMemo(
    () => ({
      [Field.INPUT]: currencyIn,
      [Field.OUTPUT]: currencyOut,
    }),
    [currencyIn, currencyOut],
  )

  const shareUrl = useMemo(() => {
    const path = `${isSwapPage ? APP_PATHS.SWAP : APP_PATHS.LIMIT}/${networkInfo.route}${
      currencyIn && currencyOut
        ? `?${stringify({
            inputCurrency: currencyId(currencyIn, chainId),
            outputCurrency: currencyId(currencyOut, chainId),
          })}`
        : ''
    }`
    return `${window.location.origin}${isCrossChainPage ? APP_PATHS.CROSS_CHAIN : path}`
  }, [networkInfo.route, currencyIn, currencyOut, chainId, isSwapPage, isCrossChainPage])

  return {
    currencies,
    currencyIn,
    currencyOut,
    shareUrl,
  }
}
export default useCurrenciesByPage
