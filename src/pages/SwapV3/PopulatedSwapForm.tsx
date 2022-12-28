import { useMemo } from 'react'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { useExpertModeManager } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

const PopulatedSwapForm = () => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const [isAdvancedMode] = useExpertModeManager()

  const props: SwapFormProps = {
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    isAdvancedMode,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
