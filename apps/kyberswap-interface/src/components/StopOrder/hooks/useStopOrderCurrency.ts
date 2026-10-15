import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { StopOrderTokenInfo } from 'components/StopOrder/types'
import { useAllTokens } from 'hooks/useTokens'

/**
 * A token an order names, as a currency to format amounts and draw a logo with. The whitelist's own
 * entry is used where there is one, since it carries the logo and the canonical symbol; any other
 * token is built from the identity the order itself carries, so no row ever waits on a lookup.
 */
export const useStopOrderCurrency = (info: StopOrderTokenInfo, chainId: ChainId): Token => {
  const whitelist = useAllTokens(true, chainId)
  return useMemo(
    () => whitelist[info.address.toLowerCase()] ?? new Token(chainId, info.address, info.decimals, info.symbol),
    [whitelist, chainId, info.address, info.decimals, info.symbol],
  )
}
