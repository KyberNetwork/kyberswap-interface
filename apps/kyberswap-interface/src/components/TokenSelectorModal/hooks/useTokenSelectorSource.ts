import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'

import { TokenSearchFilters } from 'components/TokenSelectorModal/types'
import { ETHER_ADDRESS } from 'constants/index'
import { isSupportStopMarket } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import { getOracleLookupAddress, useOracleTokens } from 'hooks/useOracleTokens'
import { TokenMap, useAllTokens } from 'hooks/useTokens'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/** Native and wrapped have separate balances, but use the same wrapped-token oracle feed. */
export const buildOracleTokenMap = (chainId: ChainId, tokens: TokenInfo[]): TokenMap => {
  const tokenMap = Object.fromEntries(
    tokens.map(token => {
      const currency = new WrappedTokenInfo(token)
      return [currency.address, currency]
    }),
  )
  const native = NativeCurrencies[chainId]
  if (native.isNative && tokens.some(token => token.address.toLowerCase() === getOracleLookupAddress(native))) {
    tokenMap[ETHER_ADDRESS] = new WrappedTokenInfo({
      chainId,
      address: ETHER_ADDRESS,
      decimals: native.decimals,
      symbol: native.symbol || '',
      name: native.name || '',
    })
  }
  return tokenMap
}

/** Owns the selector's token source and eligibility rules; browsing and selection stay in the modal. */
export const useTokenSelectorSource = (chainId: ChainId, requireOracle: boolean) => {
  const allTokens = useAllTokens(false, chainId)
  const { supportedChains } = useChainsConfig()
  const { tokens, hasOracle, tokenFilter, isReady, isLoading } = useOracleTokens(chainId, { skip: !requireOracle })

  const defaultTokens = useMemo(
    () => (requireOracle ? buildOracleTokenMap(chainId, tokens) : allTokens),
    [requireOracle, chainId, tokens, allTokens],
  )
  const chains = useMemo(
    () => (requireOracle ? supportedChains.filter(chain => isSupportStopMarket(chain.chainId)) : supportedChains),
    [requireOracle, supportedChains],
  )
  const searchFilters = useMemo<TokenSearchFilters | undefined>(
    () => (requireOracle && tokenFilter ? { oracleTokenFilter: tokenFilter } : undefined),
    [requireOracle, tokenFilter],
  )
  // Preserve the existing failure behavior: an unanswered request is not proof a token lacks a feed.
  const isListable = useCallback(
    (currency: Currency | undefined) => !requireOracle || !isReady || hasOracle(currency),
    [requireOracle, isReady, hasOracle],
  )

  return {
    defaultTokens,
    supportedChains: chains,
    searchFilters,
    isListable,
    isLoading: requireOracle && isLoading,
    isDefaultListLoading: !requireOracle && !Object.keys(allTokens).length,
    allowRpcSearch: !requireOracle,
    notice: requireOracle
      ? t`Only tokens with an Oracle price feed are shown. Stop Market orders trigger on that price.`
      : undefined,
    emptyMessage: requireOracle
      ? t`No supported tokens found. Stop Market orders only support tokens with an Oracle price feed.`
      : undefined,
  }
}
