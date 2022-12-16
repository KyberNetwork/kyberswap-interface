import { Currency } from '@kyberswap/ks-sdk-core'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useActiveWeb3React } from 'hooks'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { formattedNum } from 'utils'

type Props = {
  onSelect: () => void
  derivedSwapInfoV2: ReturnType<typeof useDerivedSwapInfoV2>
}

const OutputCurrencyPanel: React.FC<Props> = ({ onSelect, derivedSwapInfoV2 }) => {
  const { isSolana } = useActiveWeb3React()

  const { independentField, typedValue } = useSwapState()
  const { onCurrencySelection } = useSwapActionHandlers()
  const { v2Trade, parsedAmount, currencies } = derivedSwapInfoV2

  const currencyIn: Currency | undefined = currencies[Field.INPUT]
  const currencyOut: Currency | undefined = currencies[Field.OUTPUT]

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)
  const showWrap: boolean = isSolana && wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const getFormattedAmount = () => {
    if (independentField === Field.OUTPUT) {
      return typedValue
    }
    if (showWrap) {
      return parsedAmount?.toExact() || ''
    }
    return trade?.outputAmount?.toSignificant(6) ?? ''
  }

  const handleOutputSelect = (outputCurrency: Currency) => {
    onCurrencySelection(Field.OUTPUT, outputCurrency)
    onSelect()
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
      estimatedUsd={trade?.amountOutUsd ? `${formattedNum(trade.amountOutUsd.toString(), true)}` : undefined}
    />
  )
}

export default OutputCurrencyPanel
