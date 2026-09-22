import type { PreparedToken } from 'services/copyTrading/types/preparedActions'

import type { QuoteToken } from 'pages/CopyTrading/hooks/useChainQuoteToken'

// TODO: Change the temporary minimum capital amount to 0.
export const MINIMUM_CAPITAL_AMOUNT = '1'

export const CAPITAL_PERCENTAGES = [25, 50, 75, 100] as const

export type CapitalPercentage = (typeof CAPITAL_PERCENTAGES)[number]

export type CapitalPreset = {
  amount: string
  percentage: CapitalPercentage
}

export const getFundingTokenKey = (chainId: number, token?: QuoteToken) =>
  `${chainId}:${token?.address.toLowerCase() || ''}:${token?.decimals ?? ''}`

export const FUNDING_TOKEN_CHANGED = 'Funding token information changed. Review the amount and prepare again.'

export const resolveFundingToken = (
  prepared: PreparedToken | undefined,
  discovered: QuoteToken | undefined,
): QuoteToken => {
  if (
    !discovered ||
    prepared?.chainId !== discovered.chainId ||
    prepared?.address?.toLowerCase() !== discovered.address.toLowerCase() ||
    (prepared.decimals !== undefined && prepared.decimals !== discovered.decimals)
  )
    throw new Error(FUNDING_TOKEN_CHANGED)

  return {
    ...discovered,
    symbol: prepared.symbol || discovered.symbol,
    name: prepared.name || discovered.name,
    logoUrl: prepared.logoUrl || discovered.logoUrl,
  }
}
