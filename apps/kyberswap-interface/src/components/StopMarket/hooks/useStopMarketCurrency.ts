import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { StopMarketTokenInfo } from 'components/StopMarket/types'
import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useAllTokens } from 'hooks/useTokens'

/**
 * A token an order names, as a currency to format amounts and draw a logo with. The whitelist's own
 * entry is used where there is one, since it carries the logo and the canonical symbol; any other
 * token is built from the identity the order itself carries, so no row ever waits on a lookup. An order
 * paying out native currency names it by the native placeholder address, which is the chain's coin.
 */
export const useStopMarketCurrency = (info: StopMarketTokenInfo, chainId: ChainId): Currency => {
  const whitelist = useAllTokens(true, chainId)
  return useMemo(() => {
    const address = info.address.toLowerCase()
    if (address === ETHER_ADDRESS.toLowerCase()) return NativeCurrencies[chainId]
    return whitelist[address] ?? new Token(chainId, info.address, info.decimals, info.symbol)
  }, [whitelist, chainId, info.address, info.decimals, info.symbol])
}
