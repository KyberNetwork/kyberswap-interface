import { Currency } from '@kyberswap/ks-sdk-core'
import { useSelector } from 'react-redux'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { AppState } from 'state'
import { Field } from 'state/swap/actions'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
import { formattedNum } from 'utils'

type Props = {
  typedValue: string
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  usdValue: string | undefined

  onCurrencySelection: (field: Field, currency: Currency) => void
}
const OutputCurrencyPanel: React.FC<Props> = ({
  typedValue,
  currencyIn,
  currencyOut,
  usdValue,
  onCurrencySelection,
}) => {
  const routeSummary = useSelector((state: AppState) => state.swap.routeSummary)
  const parsedAmount = useParsedAmountFromInputCurrency()

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)
  // showWrap = true if this swap is either WRAP or UNWRAP
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const getFormattedAmount = () => {
    if (showWrap) {
      return parsedAmount?.toExact() || ''
    }

    return routeSummary?.parsedAmountOut?.toSignificant(6) || ''
  }

  const handleOutputSelect = (outputCurrency: Currency) => {
    onCurrencySelection(Field.OUTPUT, outputCurrency)
  }

  return (
    <CurrencyInputPanel
      disabledInput
      value={getFormattedAmount()}
      onMax={null}
      onHalf={null}
      currency={currencyOut}
      onCurrencySelect={handleOutputSelect}
      otherCurrency={currencyIn}
      id="swap-currency-output"
      showCommonBases={true}
      estimatedUsd={usdValue ? String(formattedNum(usdValue, true)) : undefined}
    />
  )
}

export default OutputCurrencyPanel
