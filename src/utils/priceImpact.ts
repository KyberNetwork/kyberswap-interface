import { ChainId } from '@kyberswap/ks-sdk-core'

import { CHAINS_BYPASS_PRICE_IMPACT } from 'constants/networks'
import { checkPriceImpact } from 'utils/prices'

export const checkShouldDisableByPriceImpact = (
  chainId: ChainId,
  isDegenMode: boolean,
  priceImpact: number | undefined,
) => {
  const priceImpactResult = checkPriceImpact(priceImpact)
  return checkAllowBypassPriceImpactRestriction(chainId)
    ? false
    : !isDegenMode && (priceImpactResult.isVeryHigh || priceImpactResult.isInvalid)
}

export const checkAllowBypassPriceImpactRestriction = (chainId: ChainId) => {
  return CHAINS_BYPASS_PRICE_IMPACT.includes(chainId)
}
