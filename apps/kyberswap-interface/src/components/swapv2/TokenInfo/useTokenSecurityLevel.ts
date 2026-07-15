import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetSecurityTokenInfoQuery } from 'services/coingecko'

import { getSecurityTokenInfo } from 'components/swapv2/TokenInfo/utils'
import { Field } from 'state/swap/actions'

/** Ordered by severity so levels can be compared/merged across tokens. */
export enum SecurityLevel {
  NONE = 0,
  WARNING = 1,
  RISKY = 2,
}

export const useSecurityLevelOfCurrency = (currency: Currency | undefined): SecurityLevel => {
  const token = currency?.wrapped

  const { data, error } = useGetSecurityTokenInfoQuery(
    { chainId: token?.chainId as ChainId, address: token?.address ?? '' },
    { skip: !token?.address },
  )

  return useMemo(() => {
    const { totalRiskContract, totalRiskTrading, totalWarningContract, totalWarningTrading } = getSecurityTokenInfo(
      error ? undefined : data,
    )
    if (totalRiskContract + totalRiskTrading > 0) return SecurityLevel.RISKY
    if (totalWarningContract + totalWarningTrading > 0) return SecurityLevel.WARNING
    return SecurityLevel.NONE
  }, [data, error])
}

/** Highest severity found across the tokens of the swap form. */
export const useSwapTokensSecurityLevel = (currencies: { [field in Field]?: Currency }): SecurityLevel => {
  const inputLevel = useSecurityLevelOfCurrency(currencies[Field.INPUT])
  const outputLevel = useSecurityLevelOfCurrency(currencies[Field.OUTPUT])

  return Math.max(inputLevel, outputLevel)
}
