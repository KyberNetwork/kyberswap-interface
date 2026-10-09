import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { isSupportStopOrder } from 'constants/networks'
import { useOracleTokens } from 'hooks/useOracleTokens'

/**
 * Tokens a stop order can monitor on a chain: those with a price feed from the chain's oracle, which is
 * what the trigger is evaluated against.
 */
export const useStopOrderSupportedTokens = (chainId: ChainId, options?: { skip?: boolean }) => {
  const chainSupportsStopOrder = isSupportStopOrder(chainId)
  const { addresses, hasOracle, isLoading, isError } = useOracleTokens(chainId, {
    skip: !chainSupportsStopOrder || options?.skip,
  })

  return {
    hasOracle,
    isLoading,
    isError,
    /**
     * False only when the chain genuinely has no feeds. A failed request leaves the list empty too,
     * and reporting that as "not available on this chain" would blame the chain for an outage and
     * block order placement with no way back.
     */
    hasEligibleTokens: chainSupportsStopOrder && (isLoading || isError || addresses.size > 0),
  }
}

/** Whether a token can be monitored. Native currency resolves to its wrapped token, which the order sells. */
export const useIsStopOrderEligibleToken = (currency?: Currency) => {
  // Without a currency there is no chain to ask about, so the placeholder must not reach the network.
  const { hasOracle, isLoading, isError } = useStopOrderSupportedTokens(
    (currency?.chainId as ChainId) ?? ChainId.MAINNET,
    { skip: !currency },
  )

  return useMemo(() => {
    if (!currency) return { isEligible: false, isLoading: false }
    if (isLoading) return { isEligible: false, isLoading: true }
    // An unanswered request is not evidence the token lacks a feed, so it must not read as ineligible.
    if (isError) return { isEligible: true, isLoading: false }
    return { isEligible: hasOracle(currency), isLoading: false }
  }, [currency, hasOracle, isLoading, isError])
}
