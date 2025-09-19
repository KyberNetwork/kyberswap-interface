import { checkPriceImpact } from 'utils/prices'

export const checkShouldDisableByPriceImpact = (isDegenMode: boolean, priceImpact: number | undefined) => {
  const priceImpactResult = checkPriceImpact(priceImpact)
  return !isDegenMode && (priceImpactResult.isVeryHigh || priceImpactResult.isInvalid)
}
