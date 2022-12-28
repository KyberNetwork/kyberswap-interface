import { useMemo } from 'react'

import SwapForm, { SwapFormProps } from 'components/SwapForm'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

const PopulatedSwapForm = () => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const props: SwapFormProps = {
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
  }

  return <SwapForm {...props} />
}

export default PopulatedSwapForm
