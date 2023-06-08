import { Currency } from '@kyberswap/ks-sdk-core'

import { STABLE_COINS_ADDRESS } from 'constants/tokens'

const useCheckStablePairSwap = (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
  const isStablePairSwap = Boolean(
    currencyIn &&
      currencyOut &&
      STABLE_COINS_ADDRESS[currencyIn.chainId].includes(currencyIn.wrapped.address) &&
      STABLE_COINS_ADDRESS[currencyOut.chainId].includes(currencyOut.wrapped.address),
  )

  return isStablePairSwap
}

export default useCheckStablePairSwap
