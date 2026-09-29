import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useGetChainlinkOracleTokensQuery } from 'services/ksSetting'

const EMPTY_ADDRESSES = new Set<string>()

/**
 * The tokens on a chain that carry a Chainlink price feed.
 *
 * `isReady` stays false while the list loads and after a failed request, so a caller can tell a token
 * with no feed apart from one that has simply not been checked yet. The set is keyed on the current
 * chain only: a list left over from the previous chain would answer for the wrong tokens.
 */
export const useChainlinkOracleTokens = (chainId: ChainId | undefined, options?: { skip?: boolean }) => {
  const skip = !chainId || !!options?.skip
  const { currentData, isError } = useGetChainlinkOracleTokensQuery(chainId as ChainId, { skip })

  const addresses = useMemo(() => (currentData ? new Set(currentData) : EMPTY_ADDRESSES), [currentData])
  const isReady = !skip && currentData !== undefined

  // Native currency answers through its wrapped token, which is what an order actually holds.
  const hasOracle = useCallback(
    (currency: Currency | undefined) => !!currency && addresses.has(currency.wrapped.address.toLowerCase()),
    [addresses],
  )

  return {
    addresses,
    hasOracle,
    isReady,
    isLoading: !skip && !isReady && !isError,
    isError: !skip && isError,
  }
}
