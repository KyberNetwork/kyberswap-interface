import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'

import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'

export function useLimitState(): {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
} {
  // use swap state to sync data between 2 tabs LO/swap
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
  const { typedValue: inputAmount } = useSwapState()

  return { currencyIn, currencyOut, inputAmount }
}

export function useLimitActionHandlers() {
  const { onSwitchTokensV2, onCurrencySelection, onUserInput } = useSwapActionHandlers()

  const setInputValue = useCallback(
    (inputAmount: string) => {
      onUserInput(Field.INPUT, inputAmount)
    },
    [onUserInput],
  )

  const setCurrencyIn = useCallback(
    (currencyIn: Currency | undefined) => {
      currencyIn && onCurrencySelection(Field.INPUT, currencyIn)
    },
    [onCurrencySelection],
  )

  const setCurrencyOut = useCallback(
    (currencyOut: Currency | undefined) => {
      currencyOut && onCurrencySelection(Field.OUTPUT, currencyOut)
    },
    [onCurrencySelection],
  )

  return {
    switchCurrency: onSwitchTokensV2,
    setCurrencyIn,
    setCurrencyOut,
    setInputValue,
  }
}
