import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useGetStopMarketOracleTokensQuery } from 'services/stopMarket'

import type { TokenInfo } from 'state/lists/wrappedTokenInfo'
import { isTokenNative } from 'utils/tokenInfo'

const EMPTY_TOKENS: TokenInfo[] = []

/**
 * The address a currency's feed is listed under: its wrapped token's, which is what an order holds. The
 * token list carries each chain's native coin as a plain token at the 0xEeee… placeholder, whose
 * `wrapped` is itself, so it is resolved to the chain's wrapped native explicitly.
 */
export const getOracleLookupAddress = (currency: Currency): string =>
  (isTokenNative(currency) ? WETH[currency.chainId].address : currency.wrapped.address).toLowerCase()

/**
 * The tokens on a chain that its stop market order oracle can price, with the token-list filter that finds
 * them, for callers that narrow a server-side search by it.
 *
 * `isReady` stays false while the list loads and after it fails, so a caller can tell a token with no
 * feed apart from one that has simply not been checked yet. The set is keyed on the current chain
 * only: a list left over from the previous chain would answer for the wrong tokens.
 */
export const useOracleTokens = (chainId: ChainId | undefined, options?: { skip?: boolean }) => {
  const skip = !chainId || !!options?.skip
  const { currentData, isError } = useGetStopMarketOracleTokensQuery(chainId as ChainId, { skip })

  const tokens = currentData?.tokens ?? EMPTY_TOKENS
  const addresses = useMemo(() => new Set(tokens.map(token => token.address.toLowerCase())), [tokens])
  const isReady = !skip && currentData !== undefined

  const hasOracle = useCallback(
    (currency: Currency | undefined) => !!currency && addresses.has(getOracleLookupAddress(currency)),
    [addresses],
  )

  return {
    addresses,
    tokens,
    hasOracle,
    tokenFilter: skip ? undefined : currentData?.tokenFilter,
    isReady,
    isLoading: !skip && !isReady && !isError,
    isError: !skip && isError,
  }
}
