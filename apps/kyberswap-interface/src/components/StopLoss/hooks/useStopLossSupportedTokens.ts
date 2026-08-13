import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetStopLossSupportedTokensQuery } from 'services/stopLoss'

import { StopLossSupportedToken } from 'components/StopLoss/types'
import { isSupportStopLoss } from 'constants/networks'

const EMPTY_TOKENS: StopLossSupportedToken[] = []

/**
 * Tokens that carry an oracle feed on a chain — the set a stop-loss can monitor. The response holds
 * addresses only, so symbols and logos still come from the app token list.
 */
export const useStopLossSupportedTokens = (chainId: ChainId, options?: { skip?: boolean }) => {
  const chainSupportsStopLoss = isSupportStopLoss(chainId)
  const { data, isLoading, isError } = useGetStopLossSupportedTokensQuery(chainId, {
    skip: !chainSupportsStopLoss || options?.skip,
  })

  const tokens = data ?? EMPTY_TOKENS

  const addresses = useMemo(() => new Set(tokens.map(token => token.address.toLowerCase())), [tokens])

  return {
    tokens,
    addresses,
    isLoading,
    isError,
    /**
     * False only when the chain genuinely has no feeds. A failed request leaves the list empty too,
     * and reporting that as "not available on this chain" would blame the chain for an outage and
     * block order placement with no way back.
     */
    hasEligibleTokens: chainSupportsStopLoss && (isLoading || isError || addresses.size > 0),
  }
}

/**
 * Whether a token can be monitored. Native currency resolves to its wrapped address because that is
 * what the signed order sells.
 */
export const useIsStopLossEligibleToken = (currency?: Currency) => {
  // Without a currency there is no chain to ask about, so the placeholder must not reach the network.
  const { addresses, isLoading, isError } = useStopLossSupportedTokens(
    (currency?.chainId as ChainId) ?? ChainId.MAINNET,
    { skip: !currency },
  )

  return useMemo(() => {
    if (!currency) return { isEligible: false, isLoading: false }
    if (isLoading) return { isEligible: false, isLoading: true }
    // An unanswered request is not evidence the token lacks a feed, so it must not read as ineligible.
    if (isError) return { isEligible: true, isLoading: false }
    return { isEligible: addresses.has(currency.wrapped.address.toLowerCase()), isLoading: false }
  }, [currency, addresses, isLoading, isError])
}
