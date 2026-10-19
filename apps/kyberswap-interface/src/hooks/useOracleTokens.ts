import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useGetOracleTokensQuery } from 'services/ksSetting'
import { useGetStopOrderOracleConfigQuery } from 'services/stopOrder'

import { isTokenNative } from 'utils/tokenInfo'

const EMPTY_ADDRESSES = new Set<string>()

/**
 * The address a currency's feed is listed under: its wrapped token's, which is what an order holds. The
 * token list carries each chain's native coin as a plain token at the 0xEeee… placeholder, whose
 * `wrapped` is itself, so it is resolved to the chain's wrapped native explicitly.
 */
export const getOracleLookupAddress = (currency: Currency): string =>
  (isTokenNative(currency) ? WETH[currency.chainId].address : currency.wrapped.address).toLowerCase()

/**
 * The tokens on a chain that its stop order oracle can price. The oracle differs from chain to chain,
 * so the chain's oracle config is read first: its `tokenFilter` is the token-list param that finds
 * that oracle's feeds, and is returned for callers that filter a list server-side.
 *
 * `isReady` stays false while either request loads and after either fails, so a caller can tell a
 * token with no feed apart from one that has simply not been checked yet. The set is keyed on the
 * current chain only: a list left over from the previous chain would answer for the wrong tokens.
 */
export const useOracleTokens = (chainId: ChainId | undefined, options?: { skip?: boolean }) => {
  const skip = !chainId || !!options?.skip
  const { currentData: config, isError: isConfigError } = useGetStopOrderOracleConfigQuery(chainId as ChainId, {
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

  const hasOracle = useCallback(
    (currency: Currency | undefined) => !!currency && addresses.has(getOracleLookupAddress(currency)),
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
