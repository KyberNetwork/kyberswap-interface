import { RouteData } from '@0xsquid/sdk'
import { t } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useDefaultTokenChain from 'pages/CrossChain/useDefaultTokenChain'
import { useIsEnoughGas } from 'pages/CrossChain/useIsEnoughGas'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

export default function useValidateInput({
  inputAmount,
  route,
  errorGetRoute,
}: {
  inputAmount: string
  route: RouteData | undefined
  errorGetRoute: boolean
}) {
  const { loadingToken, listTokenIn, listTokenOut, currencyIn, chainIdOut, currencyOut } = useDefaultTokenChain()
  const balance = useCurrencyBalance(currencyIn)
  const { chainId } = useActiveWeb3React()
  const { isEnoughEth } = useIsEnoughGas(route)
  const showErrorGas = !isEnoughEth && route

  const inputError: undefined | { state: 'warn' | 'error'; tip: string; desc?: ReactNode } = useMemo(() => {
    if (!listTokenOut.length && !listTokenIn.length && !loadingToken) {
      return { state: 'error', tip: t`Cannot get token info. Please try again later.` }
    }
    if (errorGetRoute) {
      return { state: 'warn', tip: t`Can not find route for this transaction` }
    }
    const inputNumber = Number(inputAmount)
    if (!currencyIn || !chainIdOut || !currencyOut || inputNumber === 0) return
    const parseAmount = tryParseAmount(inputAmount, currencyIn)
    if (!parseAmount) return { state: 'warn', tip: t`Input amount is not valid` }

    if (balance?.lessThan(parseAmount)) return { state: 'warn', tip: t`Insufficient ${currencyIn?.symbol} balance` }

    if (showErrorGas) {
      return {
        state: 'warn',
        tip: t`You do not have enough ${NativeCurrencies[chainId].symbol} to cover the estimated gas for this transaction.`,
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
  ])
  return inputError
}
