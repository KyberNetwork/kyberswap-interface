import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useLimitState } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import { useCurrencyFromUrl, useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { isSwapLikePath } from 'utils/routes'
import { getDefaultSwapTokenId, getTradeLocation } from 'utils/swapFlow'

/** Read-only adapter for shared headers: currencies follow the active page; chain IDs also cover unresolved/non-EVM pairs. */
export const useCurrenciesByPage = () => {
  const { inputChain, outputChain, fromCurrency, toCurrency } = useCurrencyFromUrl()
  const { pathname } = useLocation()
  const isSwapPage =
    isSwapLikePath(pathname) || pathname.startsWith(APP_PATHS.PARTNER_SWAP) || pathname.startsWith(APP_PATHS.USER_SWAP)
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN)

  const currencyInSwap = useInputCurrency()
  const currencyOutSwap = useOutputCurrency()
  const limitState = useLimitState()

  const currencyIn = isSwapPage ? currencyInSwap : limitState.currencyIn
  const currencyOut = isSwapPage ? currencyOutSwap : limitState.currencyOut

  const currencies = useMemo(
    () => ({
      [Field.INPUT]: currencyIn,
      [Field.OUTPUT]: currencyOut,
    }),
    [currencyIn, currencyOut],
  )

  const shareUrl = useMemo(() => {
    const target = getTradeLocation(isCrossChainPage ? 'cross-chain' : isSwapPage ? 'swap' : 'limit', {
      fromChain: inputChain,
      toChain: outputChain,
      tokenIn: fromCurrency || getDefaultSwapTokenId(inputChain),
      tokenOut: toCurrency || getDefaultSwapTokenId(outputChain),
    })
    return `${window.location.origin}${target.pathname}${target.search}`
  }, [inputChain, outputChain, fromCurrency, toCurrency, isSwapPage, isCrossChainPage])

  return {
    currencies,
    inputChain,
    outputChain,
    currencyIn,
    currencyOut,
    shareUrl,
  }
}
