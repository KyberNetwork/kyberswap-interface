import { Currency } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useActiveWeb3React } from 'hooks'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { AppState } from 'state'
import { Field, typeInput } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers } from 'state/swap/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { formattedNum } from 'utils'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'

const InputCurrencyPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { isSolana } = useActiveWeb3React()
  const typedValue = useSelector((state: AppState) => state.swap.typedValue)
  const routeSummary = useSelector((state: AppState) => state.swap.routeSummary)

  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)
  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : routeSummary

  const maxAmountInput: string | undefined = useMemo(() => maxAmountSpend(balanceIn)?.toExact(), [balanceIn])
  const halfAmountInput: string | undefined = useMemo(() => halfAmountSpend(balanceIn)?.toExact(), [balanceIn])

  const handleTypeInput = (value: string) => {
    console.log({ value })
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
      value={typedValue}
      positionMax="top"
      currency={currencyIn}
      onUserInput={handleTypeInput}
      onMax={isSolanaUnwrap ? null : handleMaxInput}
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
