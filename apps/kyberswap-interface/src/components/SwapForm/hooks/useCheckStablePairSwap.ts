import { Currency } from '@kyberswap/ks-sdk-core'

import { useStableCoins } from 'hooks/Tokens'

const useCheckStablePairSwap = (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
  const { isStableCoin } = useStableCoins(currencyIn?.chainId)
  const isStablePairSwap = isStableCoin(currencyIn?.wrapped?.address) && isStableCoin(currencyOut?.wrapped?.address)
  return isStablePairSwap
}

export default useCheckStablePairSwap
