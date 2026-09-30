import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useGetOracleTokensQuery } from 'services/ksSetting'
import { useGetStopLossOracleConfigQuery } from 'services/stopLoss'

const EMPTY_ADDRESSES = new Set<string>()

/**
 * The tokens on a chain that its stop-loss oracle can price. The oracle differs from chain to chain,
 * so the chain's oracle config is read first: its `tokenFilter` is the token-list param that finds
 * that oracle's feeds, and is returned for callers that filter a list server-side.
 *
 * `isReady` stays false while either request loads and after either fails, so a caller can tell a
 * token with no feed apart from one that has simply not been checked yet. The set is keyed on the
 * current chain only: a list left over from the previous chain would answer for the wrong tokens.
 */
export const useOracleTokens = (chainId: ChainId | undefined, options?: { skip?: boolean }) => {
  const skip = !chainId || !!options?.skip
  const { currentData: config, isError: isConfigError } = useGetStopLossOracleConfigQuery(chainId as ChainId, {
    skip,
  })
  const tokenFilter = config?.tokenFilter || undefined

  const { currentData, isError: isListError } = useGetOracleTokensQuery(
    { chainId: chainId as ChainId, tokenFilter: tokenFilter as string },
    { skip: skip || !tokenFilter },
  )

  const addresses = useMemo(() => (currentData ? new Set(currentData) : EMPTY_ADDRESSES), [currentData])
  const isReady = !skip && !!tokenFilter && currentData !== undefined
  // A config that names no filter leaves nothing to look feeds up by, which is as much a failure as
  // a request that never answered.
  const isError = !skip && (isConfigError || (!!config && !tokenFilter) || isListError)

  // Native currency answers through its wrapped token, which is what an order actually holds.
  const hasOracle = useCallback(
    (currency: Currency | undefined) => !!currency && addresses.has(currency.wrapped.address.toLowerCase()),
    [addresses],
  )

  return {
    addresses,
    hasOracle,
    tokenFilter: skip ? undefined : tokenFilter,
    isReady,
    isLoading: !skip && !isReady && !isError,
    isError,
  }
}
