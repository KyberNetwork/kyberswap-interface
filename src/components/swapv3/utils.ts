export const isInvalidPriceImpact = (priceImpact?: number) => priceImpact === -1
export const isHighPriceImpact = (priceImpact?: number) => !!priceImpact && priceImpact > 5
export const isVeryHighPriceImpact = (priceImpact?: number) => !!priceImpact && priceImpact > 15
