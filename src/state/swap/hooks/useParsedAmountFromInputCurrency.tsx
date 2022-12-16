import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { AppState } from 'state'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'

import { tryParseAmount } from '.'

// from the current swap inputs, compute the best trade and return it.
const useParsedAmountFromInputCurrency = () => {
  const typedValue = useSelector((state: AppState) => state.swap.typedValue)
  const inputCurrency = useInputCurrency()
  const outputCurrency = useOutputCurrency()

  const isExactIn = true

  const currency = isExactIn ? inputCurrency : outputCurrency
  const parsedAmount = useMemo(() => {
    return tryParseAmount(typedValue, currency ?? undefined)
  }, [typedValue, currency])

  return parsedAmount
}

export default useParsedAmountFromInputCurrency
