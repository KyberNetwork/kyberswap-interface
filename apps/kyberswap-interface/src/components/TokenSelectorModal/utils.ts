import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useQueries } from '@tanstack/react-query'
import axios from 'axios'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import ksSettingApi from 'services/ksSetting'

import { KS_SETTING_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import type { NetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, fetchTokenInfoFromRpc, formatAndCacheToken } from 'hooks/Tokens'
import store from 'state'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useAllTokenBalances, useNativeBalance } from 'state/wallet/hooks'
import { filterTruthy, isAddress } from 'utils'
import { isTokenNative } from 'utils/tokenInfo'

export const TOKEN_SEARCH_PAGE_SIZE = 20

const UNKNOWN_TOKEN_NAME = 'Unknown Token'
const UNKNOWN_TOKEN_SYMBOL = 'UNKNOWN'
const EMPTY_BALANCE_MAP = {}

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
  chainId: ChainId,
): Promise<WrappedTokenInfo[]> => {
  const params: TokenSearchParams = {
    query: search ?? '',
    chainIds: chainId.toString(),
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
  chainId: ChainId,
): Promise<WrappedTokenInfo[]> => {
  try {
    if (search && chainId && isAddress(chainId, search)) {
      return fetchTokenByAddress(search, chainId)
    }

    return fetchTokenSearchPage(search, page, chainId)
  } catch (error) {
    return []
  }
}

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
): (tokenA: Token, tokenB: Token) => number {
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

    if (tokenA.symbol && tokenB.symbol) {
      return tokenA.symbol.toLowerCase().localeCompare(tokenB.symbol.toLowerCase())
    }

    return tokenA.symbol ? -1 : tokenB.symbol ? 1 : 0
  }
}

export function useTokenComparator(inverted: boolean, customChain?: ChainId): (tokenA: Token, tokenB: Token) => number {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const balances = useAllTokenBalances(chainId)
  const ethBalance = useNativeBalance(chainId)
  const tokenPriceAddresses = useMemo(
    () => [...Object.keys(balances ?? EMPTY_BALANCE_MAP), NATIVE_TOKEN_ADDRESS],
    [balances],
  )
  const tokenPrices = useTokenPrices(tokenPriceAddresses, chainId)

  return useMemo(() => {
    const comparator = getTokenComparator(balances ?? EMPTY_BALANCE_MAP, ethBalance, tokenPrices)
    return inverted ? (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1 : comparator
  }, [balances, inverted, ethBalance, tokenPrices])
}
