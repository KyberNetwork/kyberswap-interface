import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useActiveWeb3React } from 'hooks'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { AppState } from 'state'
import { Field, typeInput } from 'state/swap/actions'
import { useSwapActionHandlers } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { formattedNum } from 'utils'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'

type Props = {
  onSelect: () => void
  derivedSwapInfoV2: ReturnType<typeof useDerivedSwapInfoV2>
}

const InputCurrencyPanel: React.FC<Props> = ({ onSelect, derivedSwapInfoV2 }) => {
  const dispatch = useDispatch()
  const { isSolana } = useActiveWeb3React()
  const independentField = useSelector((state: AppState) => state.swap.independentField)
  const typedValue = useSelector((state: AppState) => state.swap.typedValue)

  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const { v2Trade, currencyBalances, parsedAmount, currencies } = derivedSwapInfoV2

  const currencyIn: Currency | undefined = currencies[Field.INPUT]
  const currencyOut: Currency | undefined = currencies[Field.OUTPUT]
  const balanceIn: CurrencyAmount<Currency> | undefined = currencyBalances[Field.INPUT]

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)
  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP

  const showWrap: boolean = isSolana && wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const maxAmountInput: string | undefined = useMemo(() => maxAmountSpend(balanceIn)?.toExact(), [balanceIn])
  const halfAmountInput: string | undefined = useMemo(() => halfAmountSpend(balanceIn)?.toExact(), [balanceIn])

  const getFormattedAmount = () => {
    if (independentField === Field.INPUT) {
      return typedValue
    }
    if (showWrap) {
      return parsedAmount?.toExact() || ''
    }
    return trade?.inputAmount?.toSignificant(6) || ''
  }

  const handleTypeInput = (value: string) => {
    onUserInput(Field.INPUT, value)
  }

  const handleInputSelect = (inputCurrency: Currency) => {
    onCurrencySelection(Field.INPUT, inputCurrency)
    onSelect()
  }

  const handleMaxInput = () => {
    onUserInput(Field.INPUT, maxAmountInput || '')
  }

  const handleHalfInput = () => {
    !isSolanaUnwrap && onUserInput(Field.INPUT, halfAmountInput || '')
  }

  const valueToUnwrap = balanceIn?.toExact() ?? ''
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) {
      dispatch(typeInput({ field: Field.INPUT, typedValue: valueToUnwrap }))
    }
  }, [dispatch, isSolanaUnwrap, valueToUnwrap])

  return (
    <CurrencyInputPanel
      value={getFormattedAmount()}
      positionMax="top"
      currency={currencyIn}
      onUserInput={handleTypeInput}
      onMax={handleMaxInput}
      onHalf={isSolanaUnwrap ? null : handleHalfInput}
      onCurrencySelect={handleInputSelect}
      otherCurrency={currencyOut}
      id="swap-currency-input"
      showCommonBases={true}
      estimatedUsd={trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined}
    />
  )
}

export default InputCurrencyPanel
