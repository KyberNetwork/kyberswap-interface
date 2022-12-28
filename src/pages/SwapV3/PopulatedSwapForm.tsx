import SwapForm from 'components/SwapForm'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'

const PopulatedSwapForm = () => {
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  return <SwapForm currencyIn={currencyIn} currencyOut={currencyOut} />
}

export default PopulatedSwapForm
