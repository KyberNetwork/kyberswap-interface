import { ChainId, Currency, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { multicall } from '@wagmi/core'
import axios from 'axios'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAbstractTokens } from 'services/crossChainTokens'
import ksSettingApi from 'services/ksSetting'

import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { KS_SETTING_API } from 'constants/env'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useBytes32TokenContract, useTokenReadingContract } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { AppDispatch, AppState } from 'state'
import { setTokenList } from 'state/lists/actions'
import { TokenAddressMap } from 'state/lists/reducer'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { NEVER_RELOAD, useSingleCallResult } from 'state/multicall/hooks'
import { useUserAddedTokens } from 'state/user/hooks'
import { isAddress } from 'utils/address'
import { chunk, filterTruthy } from 'utils/array'
import { hasNativeErc20Interface } from 'utils/nativeErc20'
import { escapeQuoteString, getFormattedAddress } from 'utils/tokenInfo'
import { Address, hexToString, toBytes } from 'utils/viem'

// reduce token map into standard address <-> Token mapping
function useTokensFromMap(tokenMap: TokenAddressMap, lowercaseAddress?: boolean, customChainId?: ChainId): TokenMap {
  const { chainId: currentChainId } = useActiveWeb3React()
  const chainId = customChainId || currentChainId
  const userAddedTokens = useUserAddedTokens(chainId)

  return useMemo(() => {
    if (!chainId) return {}

    const map = tokenMap[chainId] ?? {}

    // reduce to just tokens
    const mapWithoutUrls = lowercaseAddress
      ? Object.keys(map).reduce<TokenMap>((newMap, address) => {
          const key = address.toLowerCase()
          newMap[key] = map[address]
          return newMap
        }, {})
      : map

    if (userAddedTokens.length)
      return (
        (userAddedTokens as WrappedTokenInfo[])
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<TokenMap>(
            (tokenMap, token) => {
              const key = lowercaseAddress ? token.address.toLowerCase() : token.address
              tokenMap[key] = token
              return tokenMap
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls },
          )
      )
    return mapWithoutUrls
  }, [chainId, userAddedTokens, tokenMap, lowercaseAddress])
}

export type TokenMap = { [address: string]: WrappedTokenInfo }

function listToTokenMap(list: TokenInfo[], chainId: ChainId): TokenMap {
  const map = list.reduce<TokenMap>((tokenMap, tokenInfo) => {
    const formattedAddress = getFormattedAddress(chainId, tokenInfo.address)
    if (!tokenInfo || tokenMap[formattedAddress] || !isAddress(chainId, tokenInfo.address)) {
      return tokenMap
    }
    const token = formatAndCacheToken(tokenInfo)
    if (token) tokenMap[formattedAddress] = token
    return tokenMap
  }, {})
  return map
}

// Retry transient transport/server failures, but do not repeat permanent client errors.
const shouldRetryTokenList = (failureCount: number, error: unknown) => {
  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined
  const isTransient = typeof status !== 'number' || status === 408 || status === 429 || status >= 500
  return failureCount < 2 && isTransient
}

/** Coordinates one initial whitelist load per chain and publishes only complete results to Redux.
 * Populated lists are reused; failures and empty results follow the explicit recovery policy below.
 * Successful in-flight loads may finish after unmount and populate their original chain. */
export const useEnsureTokenList = (chainId?: ChainId) => {
  const dispatch = useDispatch<AppDispatch>()
  const [fetchTokenList] = ksSettingApi.useLazyGetTokenListQuery()
  const tokenListSize = useSelector((state: AppState) =>
    chainId ? Object.keys(state.lists.mapWhitelistTokens[chainId] ?? {}).length : 0,
  )

  return useQuery({
    queryKey: ['whitelist-token-list', chainId],
    enabled: !!chainId && !tokenListSize,
    // Redux owns usable token data. This query coordinates the initial load and its retries.
    // A valid empty result may be checked again on remount/reconnect after one minute.
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: shouldRetryTokenList,
    retryDelay: attempt => Math.min(1_000 * 2 ** attempt, 4_000),
    retryOnMount: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!chainId) return null
      if (chainId === ChainId.ABSTRACT) {
        const tokens = await fetchAbstractTokens()
        dispatch(setTokenList({ chainId, tokenList: listToTokenMap(tokens, chainId) }))
        return true
      }
      const pageSize = 100
      const maximumPage = 15

      // Fetch page 1 first — its pagination.totalItems tells us how many pages exist, so the rest can be
      // fetched concurrently instead of walking them one blocking round-trip at a time.
      const firstPage = await fetchTokenList({ chainId, page: 1, pageSize, isWhitelisted: true }, false)
      if (firstPage.error) throw firstPage.error
      const firstTokens = firstPage.data?.data?.tokens
      if (!Array.isArray(firstTokens)) throw new Error('Token list response is missing tokens')
      let tokens: TokenInfo[] = firstTokens

      const totalItems = firstPage.data?.data.pagination?.totalItems
      // With a token count, request exactly the remaining pages; without one, fall back to fetching up to
      // the cap (empty pages concat harmlessly) so a missing pagination field can never drop tokens.
      const totalPages =
        totalItems != null
          ? Math.min(Math.ceil(totalItems / pageSize), maximumPage)
          : tokens.length < pageSize
          ? 1
          : maximumPage

      if (totalPages > 1) {
        const restResults = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchTokenList({ chainId, page: index + 2, pageSize, isWhitelisted: true }, false),
          ),
        )
        for (const result of restResults) {
          if (result.error) throw result.error
          const pageTokens = result.data?.data?.tokens
          if (!Array.isArray(pageTokens)) throw new Error('Token list response is missing tokens')
          tokens = tokens.concat(pageTokens)
        }
      }

      const tokenList = listToTokenMap(tokens, chainId)

      dispatch(setTokenList({ chainId, tokenList }))

      return true
    },
  })
}

/** Combines list-fetch status with the existing map debounce. Loading ends only when consumers can read the map.
 * An unresolved symbol is empty only after this loading state ends; imported tokens are merged as before. */
export const useAllTokensWithLoading = (lowercaseAddress = false, chainId?: ChainId) => {
  const { chainId: currentChainId } = useActiveWeb3React()
  const selectedChainId = chainId || currentChainId
  const { isPending, isFetching } = useEnsureTokenList(selectedChainId)
  const mapWhitelistTokens = useSelector((state: AppState) => state.lists.mapWhitelistTokens)
  const allTokens = useDebounce(mapWhitelistTokens, 300)
  const tokens = useTokensFromMap(allTokens, lowercaseAddress, selectedChainId)
  const currentMap = mapWhitelistTokens[selectedChainId]
  const isLoading =
    ((isPending || isFetching) && !Object.keys(currentMap ?? {}).length) || currentMap !== allTokens[selectedChainId]
  return { tokens, isLoading }
}

export function useAllTokens(lowercaseAddress = false, chainId?: ChainId): TokenMap {
  return useAllTokensWithLoading(lowercaseAddress, chainId).tokens
}

export function useIsLoadedTokenDefault() {
  const defaultTokens = useAllTokens()
  const tokenImports: Token[] = useUserAddedTokens()
  return Object.keys(defaultTokens).length > tokenImports.length
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && toBytes(bytes32 as `0x${string}`)[31] === 0
    ? hexToString(bytes32 as `0x${string}`, { size: 32 })
    : defaultValue
}

// undefined if invalid or does not exist
// null if loading
// otherwise returns the token
export function useToken(tokenAddress?: string): Token | NativeCurrency | undefined | null {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  const address = isAddress(chainId, tokenAddress)

  const tokenContract = useTokenReadingContract(address && tokenAddress !== ZERO_ADDRESS ? address : undefined)
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined)
  const token =
    tokenAddress?.toLowerCase() === ZERO_ADDRESS || tokenAddress?.toLowerCase() === ETHER_ADDRESS.toLowerCase()
      ? NativeCurrencies[chainId]
      : address
      ? tokens[address]
      : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD,
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, NEVER_RELOAD)
  const decimalsResult = decimals.result?.[0]
  const symbolResult = symbol.result?.[0]
  const symbolBytes32Result = symbolBytes32.result?.[0]
  const tokenNameResult = tokenName.result?.[0]
  const tokenNameBytes32Result = tokenNameBytes32.result?.[0]

  return useMemo(() => {
    if (token) return token
    if (!address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (typeof decimalsResult === 'number') {
      return new Token(
        chainId,
        address,
        decimalsResult,
        parseStringOrBytes32(symbolResult, symbolBytes32Result, 'UNKNOWN'),
        parseStringOrBytes32(tokenNameResult, tokenNameBytes32Result, 'Unknown Token'),
      )
    }
    return undefined
  }, [
    address,
    chainId,
    decimals.loading,
    decimalsResult,
    symbol.loading,
    symbolResult,
    symbolBytes32Result,
    token,
    tokenName.loading,
    tokenNameResult,
    tokenNameBytes32Result,
  ])
}

// This function is intended to use for EVM chains only
export const fetchTokenInfoFromRpc = async (tokenAddress: string, chainId: ChainId, options?: { silent?: boolean }) => {
  try {
    const address = isAddress(chainId, tokenAddress)

    if (!NETWORKS_INFO[chainId]?.multicall) {
      if (!options?.silent) console.error('No multicall contract found')
      return undefined
    }

    if (!address) {
      if (!options?.silent) console.error('Invalid token address')
      return undefined
    }

    const results = await multicall(wagmiConfig, {
      allowFailure: true,
      chainId: chainId as number,
      contracts: [
        { address: address as Address, abi: ERC20_ABI, functionName: 'name' },
        { address: address as Address, abi: ERC20_ABI, functionName: 'symbol' },
        { address: address as Address, abi: ERC20_ABI, functionName: 'decimals' },
      ],
    })

    // Decimals is the only field required to construct a valid Token; tolerate
    // legacy ERC20s missing name()/symbol() (e.g. MKR returns bytes32) and
    // fall back to empty strings to preserve pre-migration behavior.
    if (results[2].status !== 'success') {
      if (!options?.silent) console.error('ERC20 metadata multicall: decimals read failed', results)
      return undefined
    }
    const name = results[0].status === 'success' ? (results[0].result as string) : ''
    const symbol = results[1].status === 'success' ? (results[1].result as string) : ''
    const decimals = results[2].result as number

    return new Token(chainId, address, decimals, symbol, name)
  } catch (e) {
    if (!options?.silent) console.error(e)
    return undefined
  }
}

const cacheTokens: TokenMap = {}
export const findCacheToken = (address: string, chainId?: ChainId) => {
  if (!address) return
  let cachedToken: WrappedTokenInfo | undefined = cacheTokens[address] || cacheTokens[address.toLowerCase()]
  if (chainId && cachedToken && cachedToken.chainId !== chainId) cachedToken = undefined

  return cachedToken
}

// The catalog pages this endpoint (10 per page by default, 100 at most), so addresses are asked
// for in pages of that size with the page size stated explicitly; otherwise a list past the default
// silently comes back short.
const TOKEN_LOOKUP_PAGE_SIZE = 100

/**
 * Catalog tokens for a list of addresses: those already looked up this session come from the cache,
 * the rest from the catalog. Throws when the catalog replies without a token list, so a failure never
 * reads as "these addresses are unknown".
 */
export const fetchListTokenByAddresses = async (address: string[], chainId: ChainId): Promise<WrappedTokenInfo[]> => {
  if (chainId === ChainId.ABSTRACT) {
    const addresses = new Set(address.map(item => item.toLowerCase()))
    return filterTruthy(
      (await fetchAbstractTokens())
        .filter(token => addresses.has(token.address.toLowerCase()))
        .map(formatAndCacheToken),
    )
  }
  const cached = filterTruthy(address.map(addr => findCacheToken(addr, chainId)))
  const missing = address.filter(addr => !findCacheToken(addr, chainId))
  if (!missing.length) return cached

  const pages = await Promise.all(
    chunk(missing, TOKEN_LOOKUP_PAGE_SIZE).map(async page => {
      const response = await axios.get(
        `${KS_SETTING_API}/v1/tokens?addresses=${page}&chainIds=${chainId}&page=1&pageSize=${TOKEN_LOOKUP_PAGE_SIZE}`,
      )
      const tokens = response?.data?.data?.tokens
      if (!Array.isArray(tokens)) throw new Error('token catalog replied without a token list')
      return filterTruthy(tokens.map(formatAndCacheToken)) as WrappedTokenInfo[]
    }),
  )
  return [...cached, ...pages.flat()]
}

export const formatAndCacheToken = (rawTokenResponse: TokenInfo) => {
  try {
    // Where the native asset has a built-in ERC-20 interface, the sentinel and that interface are
    // the same asset. Admitting the sentinel as a token would list it twice, and the second copy
    // would carry the native interface's decimals — a balance and every amount read 10^12 out.
    if (
      hasNativeErc20Interface(rawTokenResponse.chainId) &&
      rawTokenResponse.address?.toLowerCase() === ETHER_ADDRESS.toLowerCase()
    ) {
      return
    }

    const tokenResponse = { ...rawTokenResponse }
    tokenResponse.symbol = escapeQuoteString(tokenResponse.symbol)
    tokenResponse.name = escapeQuoteString(tokenResponse.name)

    const tokenInfo = new WrappedTokenInfo(tokenResponse)
    if (!tokenInfo.decimals && !tokenInfo.symbol && !tokenInfo.name) {
      return
    }
    cacheTokens[tokenResponse.address] = tokenInfo
    return tokenInfo
  } catch (e) {
    return
  }
}

export function useCurrency(currencyId: string | undefined): Currency | null | undefined {
  const { chainId } = useActiveWeb3React()
  const isETH = useMemo(
    () => chainId && currencyId?.toUpperCase() === NativeCurrencies[chainId].symbol?.toUpperCase(),
    [chainId, currencyId],
  )
  const token = useToken(isETH ? undefined : currencyId)
  return useMemo(() => (isETH ? NativeCurrencies[chainId] : token), [chainId, isETH, token])
}

/** Resolves native/address metadata, using a known token before requesting remote metadata. */
export const useCurrencyLookup = (currencyId: string | undefined, chainId: ChainId, knownToken?: Currency) => {
  const lowercaseId = currencyId?.toLowerCase()
  const nativeCurrency = NativeCurrencies[chainId]
  const isNative =
    !!currencyId && [nativeCurrency.symbol?.toLowerCase(), 'eth', ETHER_ADDRESS.toLowerCase()].includes(lowercaseId)
  const address = isAddress(chainId, currencyId) || ''
  const shouldFetch = !!address && !isNative && !knownToken

  const { currentData: token, isFetching: isTokenLoading } = ksSettingApi.useGetTokenByAddressQuery(
    { address, chainId },
    { skip: chainId === ChainId.ABSTRACT || !shouldFetch },
  )
  const { data: rpcToken, isLoading: isRpcLoading } = useQuery({
    queryKey: ['cross-chain-token', chainId, lowercaseId],
    enabled: chainId === ChainId.ABSTRACT && shouldFetch,
    queryFn: async () => (await fetchTokenInfoFromRpc(address, chainId)) ?? null,
    staleTime: Infinity,
  })

  const currency = !currencyId ? undefined : isNative ? nativeCurrency : knownToken || rpcToken || token
  const isLoading = !currency && shouldFetch && (chainId === ChainId.ABSTRACT ? isRpcLoading : isTokenLoading)
  return { currency, isLoading }
}

export const useCurrencyV2 = (currencyId: string | undefined, customChainId?: ChainId): Currency | null | undefined =>
  useCurrencyV2WithLoading(currencyId, customChainId).currency

export const useCurrencyV2WithLoading = (currencyId: string | undefined, customChainId?: ChainId) => {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChainId || currentChain
  const whitelistTokens = useAllTokens(false, chainId)
  const knownToken = currencyId ? whitelistTokens[currencyId] || whitelistTokens[currencyId.toLowerCase()] : undefined
  return useCurrencyLookup(currencyId, chainId, knownToken)
}

export const useStableCoins = (chainId: ChainId | undefined) => {
  const { data } = ksSettingApi.useGetTokenListQuery(
    { chainId: chainId as ChainId, isStable: true },
    { skip: !chainId },
  )

  const stableCoins = useMemo(() => {
    return data?.data?.tokens || []
  }, [data])

  const isStableCoin = useCallback(
    (address: string | undefined) => {
      if (!address) return false
      return stableCoins.some(token => token.address.toLowerCase() === address?.toLowerCase())
    },
    [stableCoins],
  )
  return { isStableCoin, stableCoins }
}
