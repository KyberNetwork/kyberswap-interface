import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers } from 'state/swap/hooks'
import { formattedNum } from 'utils'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'

type Props = {
  disableMaxButton: boolean
  disableHalfButton: boolean
  hideAmountInUsd: boolean
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  amountInUsd: string | undefined
  typedValue: string
}
const InputCurrencyPanel: React.FC<Props> = ({
  disableMaxButton,
  disableHalfButton,
  hideAmountInUsd,
  currencyIn,
  currencyOut,
  balanceIn,
  amountInUsd,
  typedValue,
}) => {
  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()

  const maxAmountInput: string | undefined = useMemo(() => maxAmountSpend(balanceIn)?.toExact(), [balanceIn])
  const halfAmountInput: string | undefined = useMemo(() => halfAmountSpend(balanceIn)?.toExact(), [balanceIn])

  const handleTypeInput = (value: string) => {
    onUserInput(Field.INPUT, value)
  }

  const handleInputSelect = (inputCurrency: Currency) => {
    onCurrencySelection(Field.INPUT, inputCurrency)
  }

  const handleMaxInput = () => {
    onUserInput(Field.INPUT, maxAmountInput || '')
  }

  const handleHalfInput = () => {
    onUserInput(Field.INPUT, halfAmountInput || '')
  }

  return (
    <CurrencyInputPanel
      value={typedValue}
      positionMax="top"
      currency={currencyIn}
      onUserInput={handleTypeInput}
      onMax={disableMaxButton ? null : handleMaxInput}
      onHalf={disableHalfButton ? null : handleHalfInput}
      onCurrencySelect={handleInputSelect}
      otherCurrency={currencyOut}
      id="swap-currency-input"
      showCommonBases={true}
      estimatedUsd={amountInUsd && !hideAmountInUsd ? `${formattedNum(amountInUsd, true)}` : undefined}
    />
  )
}

export default InputCurrencyPanel
