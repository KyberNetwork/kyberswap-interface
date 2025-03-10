import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { WrapType } from 'hooks/useWrapCallback'
import { formattedNum } from 'utils'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'

type Props = {
  wrapType: WrapType
  typedValue: string
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  onChangeCurrencyIn: (c: Currency) => void
  setTypedValue: (v: string) => void
  customChainId?: ChainId
}
const InputCurrencyPanel: React.FC<Props> = ({
  wrapType,
  typedValue,
  setTypedValue,
  currencyIn,
  currencyOut,
  balanceIn,
  onChangeCurrencyIn,
  customChainId,
}) => {
  const { routeSummary } = useSwapFormContext()
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : routeSummary

  const handleMaxInput = () => {
    const max = maxAmountSpend(balanceIn)?.toExact()
    setTypedValue(max || '')
  }

  const handleHalfInput = () => {
    const half = halfAmountSpend(balanceIn)?.toExact()
    setTypedValue(half || '')
  }

  return (
    <CurrencyInputPanel
      value={typedValue}
      positionMax="top"
      currency={currencyIn}
      onUserInput={setTypedValue}
      onMax={handleMaxInput}
      onHalf={handleHalfInput}
      onCurrencySelect={onChangeCurrencyIn}
      otherCurrency={currencyOut}
      id="swap-currency-input"
      dataTestId="swap-currency-input"
      showCommonBases={true}
      estimatedUsd={trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined}
      customChainId={customChainId}
    />
  )
}

export default InputCurrencyPanel
