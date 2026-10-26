import { formatUnits } from 'viem'

import type { NormalizedQuote } from 'pages/CrossChainSwap/adapters/types'

type QuoteInput = Omit<NormalizedQuote, 'formattedOutputAmount' | 'rate' | 'priceImpact'>

export const normalizeQuote = (quote: QuoteInput): NormalizedQuote => {
  const { quoteParams: params, outputAmount, inputUsd, outputUsd, gasDrop } = quote
  const formattedOutputAmount = formatUnits(outputAmount, params.toToken.decimals)
  const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
  const hasPrices = Number.isFinite(inputUsd) && inputUsd > 0 && Number.isFinite(outputUsd) && outputUsd > 0

  return {
    ...quote,
    // Copy source filters as well; token and wallet objects retain their SDK identities.
    quoteParams: Object.freeze({
      ...params,
      includedSources: params.includedSources?.slice(),
      excludedSources: params.excludedSources?.slice(),
    }),
    formattedOutputAmount,
    rate: Number(formattedOutputAmount) / Number(formattedInputAmount),
    priceImpact: hasPrices ? ((inputUsd - outputUsd - (gasDrop?.amountUsd || 0)) * 100) / inputUsd : null,
  }
}
