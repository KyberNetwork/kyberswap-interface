import { useMemo } from 'react'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

const PopulatedSwapForm = () => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const [isAdvancedMode] = useExpertModeManager()
  const [allowedSlippage] = useUserSlippageTolerance()

  const { recipient } = useSwapState()
  const { onSwitchTokensV2, onUserInput, onCurrencySelection, onChangeRecipient, onResetSelectCurrency } =
    useSwapActionHandlers()

  const props: SwapFormProps = {
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    isAdvancedMode,
    allowedSlippage,
    recipient,

    onReverseTokenSelection: onSwitchTokensV2,
    onUserInput,
    onCurrencySelection,
    onResetSelectCurrency,
    onChangeRecipient,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
