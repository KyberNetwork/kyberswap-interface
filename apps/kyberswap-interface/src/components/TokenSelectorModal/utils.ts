import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useQueries } from '@tanstack/react-query'
import axios from 'axios'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import ksSettingApi from 'services/ksSetting'

import { KS_SETTING_API } from 'constants/env'
import { ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import type { NetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, fetchTokenInfoFromRpc, formatAndCacheToken } from 'hooks/useTokens'
import store from 'state'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useAllTokenBalances, useNativeBalance } from 'state/wallet/hooks'
import { isAddress } from 'utils/address'
import { filterTruthy } from 'utils/array'
import { isTokenNative } from 'utils/tokenInfo'

export const TOKEN_SEARCH_PAGE_SIZE = 20

const UNKNOWN_TOKEN_NAME = 'Unknown Token'
const UNKNOWN_TOKEN_SYMBOL = 'UNKNOWN'
const EMPTY_BALANCE_MAP = {}
const EMPTY_PRICE_ADDRESSES: string[] = []

type TokenBalanceMap = {
  [tokenAddress: string]: TokenAmount | undefined
}

type TokenPriceMap = {
  [tokenAddress: string]: number
}

type TokenSearchParams = {
  query: string
  isWhitelisted?: boolean
  pageSize: number
  page: number
  chainIds: string
}

type UseAddressRpcTokenSearchParams = {
  chainId: ChainId
  debouncedQuery: string
  supportedChains: NetworkInfo[]
  isImportedTab: boolean
  isQueryValidEVMAddress: boolean
  isFetchedTokenSearch: boolean
  isFetchingTokenSearch: boolean
  hasTokenSearchResults: boolean
}

const toSearchParams = (params: TokenSearchParams) =>
  new URLSearchParams(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])))

const fetchTokenByAddress = async (address: string, chainId: ChainId): Promise<WrappedTokenInfo[]> => {
  const { data: token } = await store.dispatch(ksSettingApi.endpoints.getTokenByAddress.initiate({ address, chainId }))
  return token ? [token as WrappedTokenInfo] : []
}

const fetchTokenSearchPage = async (
  search: string | undefined,
  page: number,
  chainIds: ChainId[],
): Promise<WrappedTokenInfo[]> => {
  const params: TokenSearchParams = {
    query: search ?? '',
    chainIds: chainIds.join(','),
    page,
    pageSize: TOKEN_SEARCH_PAGE_SIZE,
    ...(!search && { isWhitelisted: true }),
  }
  const response = await axios.get(`${KS_SETTING_API}/v1/tokens?${toSearchParams(params).toString()}`)
  const { tokens = [] } = response.data.data

  return filterTruthy(tokens.map(formatAndCacheToken))
}

export const fetchTokens = async (
  search: string | undefined,
  page: number,
  chainIds: ChainId[],
): Promise<WrappedTokenInfo[]> => {
  try {
    const primaryChainId = chainIds[0]
    if (search && primaryChainId && isAddress(primaryChainId, search)) {
      return fetchTokenByAddress(search, primaryChainId)
    }

    return fetchTokenSearchPage(search, page, chainIds)
  } catch (error) {
    return []
  }
}

/**
 * Whether picking this token should open the import-warning screen rather than select it directly:
 * a non-native, non-whitelisted token that the user hasn't imported yet (and import is available).
 * Shared by the row click and the Enter-to-select shortcut so both honor the same gate.
 */
export const getNeedsImport = (
  currency: Currency,
  isImported: (address: string) => boolean,
  canImport: boolean,
): boolean =>
  canImport &&
  !isTokenNative(currency) &&
  !(currency as WrappedTokenInfo)?.isWhitelisted &&
  !isImported(currency.wrapped.address)

const getRpcSearchChainIds = (chainId: ChainId, supportedChains: NetworkInfo[]) => {
  const otherChainIds = supportedChains
    .map(networkInfo => networkInfo.chainId)
    .filter(supportedChainId => supportedChainId !== chainId && NETWORKS_INFO[supportedChainId]?.multicall)

  return [chainId, ...otherChainIds]
}

const sortWhitelistedFirst = (tokenA: WrappedTokenInfo, tokenB: WrappedTokenInfo) =>
  Number(tokenB.isWhitelisted) - Number(tokenA.isWhitelisted)

const fetchRpcToken = async (query: string, rpcChainId: ChainId, currentChainId: ChainId) => {
  const rawToken = await fetchTokenInfoFromRpc(query, rpcChainId, {
    silent: rpcChainId !== currentChainId,
  })
  if (!rawToken) return undefined

  const [tokenFromApi] = await fetchListTokenByAddresses([rawToken.address], rawToken.chainId as ChainId).catch(
    () => [],
  )
  if (tokenFromApi) return tokenFromApi

  return new WrappedTokenInfo({
    chainId: rawToken.chainId,
    address: rawToken.address,
    name: rawToken.name || UNKNOWN_TOKEN_NAME,
    decimals: rawToken.decimals,
    symbol: rawToken.symbol || UNKNOWN_TOKEN_SYMBOL,
  })
}

export const useAddressRpcTokenSearch = ({
  chainId,
  debouncedQuery,
  supportedChains,
  isImportedTab,
  isQueryValidEVMAddress,
  isFetchedTokenSearch,
  isFetchingTokenSearch,
  hasTokenSearchResults,
}: UseAddressRpcTokenSearchParams) => {
  const rpcSearchChainIds = useMemo(() => getRpcSearchChainIds(chainId, supportedChains), [chainId, supportedChains])
  const shouldFetchRpcTokens =
    !!debouncedQuery &&
    !isImportedTab &&
    isQueryValidEVMAddress &&
    isFetchedTokenSearch &&
    !isFetchingTokenSearch &&
    !hasTokenSearchResults

  const rpcTokenQueries = useQueries({
    queries: rpcSearchChainIds.map(rpcChainId => ({
      queryKey: ['currency-search-rpc-token', rpcChainId, debouncedQuery],
      enabled: shouldFetchRpcTokens,
      queryFn: () => fetchRpcToken(debouncedQuery, rpcChainId, chainId),
      // On-chain token metadata is immutable; don't re-run the ~15-chain fan-out on window refocus.
      staleTime: 300_000,
      refetchOnWindowFocus: false,
      retry: false,
    })),
  })

  const rpcTokens = useMemo(
    () => (shouldFetchRpcTokens ? filterTruthy(rpcTokenQueries.map(query => query.data)) : []),
    [rpcTokenQueries, shouldFetchRpcTokens],
  )

  const currentChainRpcToken = useMemo(() => rpcTokens.find(token => token.chainId === chainId), [chainId, rpcTokens])
  const otherChainTokens = useMemo(
    () => rpcTokens.filter(token => token.chainId !== chainId).sort(sortWhitelistedFirst),
    [chainId, rpcTokens],
  )

  const isFetchingRpcTokens = shouldFetchRpcTokens && rpcTokenQueries.some(query => query.isFetching)
  const isLoadingRpcTokens = shouldFetchRpcTokens && rpcTokenQueries.some(query => query.isLoading)

  return {
    currentChainRpcToken,
    otherChainTokens,
    isCheckingOtherChains: isLoadingRpcTokens || isFetchingRpcTokens,
  }
}

function balanceComparator(
  balanceA?: TokenAmount | CurrencyAmount<Currency>,
  balanceB?: TokenAmount | CurrencyAmount<Currency>,
) {
  if (balanceA && balanceB) {
    if (balanceA.equalTo(balanceB)) return 0
    const isBalanceAGreater = JSBI.greaterThan(
      JSBI.multiply(balanceA.quotient, balanceB.decimalScale),
      JSBI.multiply(balanceB.quotient, balanceA.decimalScale),
    )
    return isBalanceAGreater ? -1 : 1
  }

  if (balanceA?.greaterThan('0')) {
    return -1
  }

  if (balanceB?.greaterThan('0')) {
    return 1
  }

  return 0
}

function usdValueOf(balance: TokenAmount | CurrencyAmount<Currency> | undefined, price: number | undefined): number {
  if (!balance || !price || price <= 0) return 0
  const amount = parseFloat(balance.toExact())
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return amount * price
}

function getTokenComparator(
  balances: TokenBalanceMap,
  ethBalance: CurrencyAmount<Currency> | undefined,
  tokenPrices: TokenPriceMap,
  // Addresses (lowercased) to float above non-favorites once balance/value is a tie.
  favoriteAddresses?: Set<string>,
): (tokenA: Token, tokenB: Token) => number {
  const favoriteKey = (token: Token) => (isTokenNative(token) ? ETHER_ADDRESS : token.address).toLowerCase()
  return function sortTokens(tokenA: Token, tokenB: Token): number {
    const balanceA = isTokenNative(tokenA) ? ethBalance : balances[tokenA.address]
    const balanceB = isTokenNative(tokenB) ? ethBalance : balances[tokenB.address]

    const priceA = tokenPrices[tokenA.address?.toLowerCase()] ?? tokenPrices[tokenA.address]
    const priceB = tokenPrices[tokenB.address?.toLowerCase()] ?? tokenPrices[tokenB.address]
    const usdBalanceA = usdValueOf(balanceA, priceA)
    const usdBalanceB = usdValueOf(balanceB, priceB)

    if (usdBalanceA > 0 || usdBalanceB > 0) {
      if (usdBalanceA !== usdBalanceB) return usdBalanceB - usdBalanceA
    }

    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    // Favorites rank above non-favorites, but only after balance/value — a held token still leads.
    if (favoriteAddresses?.size) {
      const favA = favoriteAddresses.has(favoriteKey(tokenA))
      const favB = favoriteAddresses.has(favoriteKey(tokenB))
      if (favA !== favB) return favA ? -1 : 1
    }

    if (tokenA.symbol && tokenB.symbol) {
      return tokenA.symbol.toLowerCase().localeCompare(tokenB.symbol.toLowerCase())
    }

    return tokenA.symbol ? -1 : tokenB.symbol ? 1 : 0
  }
}

export function useTokenComparator(
  inverted: boolean,
  customChain?: ChainId,
  // Only the tabs that sort by wallet value need this; when disabled it registers no whole-whitelist
  // balanceOf multicall and no /prices fetch, and just falls back to a symbol sort.
  enabled = true,
  // Lowercased favorite addresses to float above non-favorites once balance/value is a tie.
  favoriteAddresses?: Set<string>,
): (tokenA: Token, tokenB: Token) => number {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const balances = useAllTokenBalances(chainId, enabled)
  const ethBalance = useNativeBalance(chainId)
  const tokenPriceAddresses = useMemo(
    () => (enabled ? [...Object.keys(balances ?? EMPTY_BALANCE_MAP), NATIVE_TOKEN_ADDRESS] : EMPTY_PRICE_ADDRESSES),
    [balances, enabled],
  )
  const tokenPrices = useTokenPrices(tokenPriceAddresses, chainId)

  return useMemo(() => {
    const comparator = getTokenComparator(balances ?? EMPTY_BALANCE_MAP, ethBalance, tokenPrices, favoriteAddresses)
    return inverted ? (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1 : comparator
  }, [balances, inverted, ethBalance, tokenPrices, favoriteAddresses])
}
