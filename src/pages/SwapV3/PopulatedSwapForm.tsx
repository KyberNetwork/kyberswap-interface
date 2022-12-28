import { useMemo } from 'react'

import SwapForm from 'components/SwapForm'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

const PopulatedSwapForm = () => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  return <SwapForm currencyIn={currencyIn} currencyOut={currencyOut} balanceIn={balanceIn} balanceOut={balanceOut} />
}

export default PopulatedSwapForm
