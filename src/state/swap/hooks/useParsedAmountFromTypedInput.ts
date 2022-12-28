import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { AppState } from 'state'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'

import { tryParseAmount } from '.'
import { Field } from '../actions'

const useParsedAmountFromTypedInput = () => {
  const typedValue = useSelector((state: AppState) => state.swap.typedValue)
  const independentField = useSelector((state: AppState) => state.swap.independentField)
  const inputCurrency = useInputCurrency()
  const outputCurrency = useOutputCurrency()

  const isExactIn = independentField === Field.INPUT

  const currency = isExactIn ? inputCurrency : outputCurrency
  const parsedAmount = useMemo(() => {
    return tryParseAmount(typedValue, currency ?? undefined)
  }, [typedValue, currency])

  return parsedAmount
}

export default useParsedAmountFromTypedInput
