import { Currency } from '@kyberswap/ks-sdk-core'
import { useSelector } from 'react-redux'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { AppState } from 'state'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers } from 'state/swap/hooks'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
import { formattedNum } from 'utils'

const OutputCurrencyPanel: React.FC = () => {
  const typedValue = useSelector((state: AppState) => state.swap.typedValue)
  const routeSummary = useSelector((state: AppState) => state.swap.routeSummary)
  const { onCurrencySelection } = useSwapActionHandlers()

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
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

  const getEstimatedUsd = () => {
    if (showWrap) {
      return undefined
    }

    return routeSummary?.amountOutUsd ? `${formattedNum(routeSummary.amountOutUsd.toString(), true)}` : undefined
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
      estimatedUsd={getEstimatedUsd()}
    />
  )
}

export default OutputCurrencyPanel
