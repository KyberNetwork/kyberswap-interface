import { t } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useIsEnoughGas } from 'pages/CrossChain/useIsEnoughGas'
import { useCrossChainState } from 'state/crossChain/hooks'
import { RouteData } from 'state/crossChain/reducer'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

export const useIsTokensSupport = () => {
  const [{ listTokenIn, listTokenOut, currencyIn, currencyOut }] = useCrossChainState()
  return useMemo(
    () =>
      (listTokenIn.some(e => currencyIn?.equals(e)) || currencyIn?.isNative) &&
      listTokenOut.some(e => currencyOut?.equals(e) || currencyOut?.isNative),
    [listTokenIn, listTokenOut, currencyIn, currencyOut],
  )
}

type InputError = undefined | { state: 'warn' | 'error'; tip: string; desc?: ReactNode; insufficientFund?: boolean }
export default function useValidateInput({
  inputAmount,
  route,
  errorGetRoute,
}: {
  inputAmount: string
  route: RouteData | undefined
  errorGetRoute: boolean
}) {
  const [{ loadingToken, listTokenIn, listTokenOut, currencyIn, chainIdOut, currencyOut, formatRoute }] =
    useCrossChainState()
  const balance = useCurrencyBalance(currencyIn)
  const { chainId, account } = useActiveWeb3React()
  const { isEnoughEth } = useIsEnoughGas(route)
  const { amountUsdIn } = formatRoute
  const showErrorGas = !isEnoughEth && route
  const isTokenSupport = useIsTokensSupport()

  const inputError: InputError = useMemo(() => {
    if (!listTokenOut.length && !listTokenIn.length && !loadingToken) {
      return { state: 'error', tip: t`Cannot get token info. Please try again later.` }
    }
    if (currencyIn && currencyOut && !isTokenSupport) {
      return {
        state: 'warn',
        tip: t`This token is not supported yet for cross-chain swaps.`,
      }
    }
    if (errorGetRoute) {
      return {
        state: 'warn',
        tip: t`We couldn't find a route for this trade. You can try changing the amount to swap, increasing the slippage, selecting a different chain or tokens, or try again later.`,
      }
    }
    const inputNumber = Number(inputAmount)
    if (!currencyIn || !chainIdOut || !currencyOut || inputNumber === 0) return
    const parseAmount = tryParseAmount(inputAmount, currencyIn)
    if (!parseAmount) return { state: 'warn', tip: t`Input amount is not valid` }

    if (Number(amountUsdIn) > 100_000)
      return {
        state: 'error',
        tip: t`Transaction size is currently limited to $100,000.`,
        desc: t`Please decrease the size of your transaction and try again.`,
      }

    const currencyInSymbol = currencyIn?.symbol
    if (balance?.lessThan(parseAmount))
      return { state: 'warn', tip: t`Insufficient ${currencyInSymbol} balance`, insufficientFund: true }

    if (showErrorGas && account) {
      const nativeSymbol = NativeCurrencies[chainId].symbol
      return {
        state: 'warn',
        tip: t`You do not have enough ${nativeSymbol} to cover the estimated gas for this transaction.`,
      }
    }
    return
  }, [
    chainIdOut,
    inputAmount,
    loadingToken,
    listTokenOut,
    listTokenIn,
    currencyIn,
    currencyOut,
    balance,
    showErrorGas,
    chainId,
    errorGetRoute,
    amountUsdIn,
    isTokenSupport,
    account,
  ])
  return inputError
}
