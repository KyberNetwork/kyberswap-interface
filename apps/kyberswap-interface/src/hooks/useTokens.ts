import { ChainId, Currency, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { multicall } from '@wagmi/core'
import axios from 'axios'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
import { filterTruthy, isAddress } from 'utils'
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

const fetchedChainIds = new Set<ChainId>()
const fetchingChainIds = new Set<ChainId>()

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

export function useEnsureTokenList(chainId?: ChainId) {
  const dispatch = useDispatch<AppDispatch>()
  const [fetchTokenList] = ksSettingApi.useLazyGetTokenListQuery()
  const tokenListSize = useSelector((state: AppState) =>
    chainId ? Object.keys(state.lists.mapWhitelistTokens[chainId] ?? {}).length : 0,
  )

  useEffect(() => {
    if (!chainId || tokenListSize) return
    if (fetchedChainIds.has(chainId) || fetchingChainIds.has(chainId)) return

    const getTokens = async () => {
      fetchingChainIds.add(chainId)
      try {
        let tokens: TokenInfo[] = []
        const pageSize = 100
        const maximumPage = 15
        let page = 1

        while (true) {
          const { data, error } = await fetchTokenList({ chainId, page, pageSize, isWhitelisted: true }, true)
          if (error) throw error
          page++
          const tokensResponse = data?.data.tokens ?? []
          tokens = tokens.concat(tokensResponse)
          if (tokensResponse.length < pageSize || page >= maximumPage) break // out of tokens, and prevent infinity loop
        }

        const tokenList = listToTokenMap(tokens, chainId)

        if (chainId === ChainId.GÖRLI) {
          dispatch(
            setTokenList({
              chainId,
              tokenList: {
                ...tokenList,
                '0x1BBeeEdCF32dc2c1Ebc2F138e3FC7f3DeCD44D6A': new WrappedTokenInfo({
                  address: '0x1BBeeEdCF32dc2c1Ebc2F138e3FC7f3DeCD44D6A',
                  chainId: ChainId.GÖRLI,
                  decimals: 18,
                  name: 'DAI',
                  symbol: 'DAI',
                  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
                }),
                '0x2Bf64aCf7eAd856209749D0D125e9Ade2D908E7f': new WrappedTokenInfo({
                  address: '0x2Bf64aCf7eAd856209749D0D125e9Ade2D908E7f',
                  chainId: ChainId.GÖRLI,
                  decimals: 18,
                  name: 'USDT',
                  symbol: 'USDT',
                  logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
                }),
              },
            }),
          )
        } else dispatch(setTokenList({ chainId, tokenList }))

        fetchedChainIds.add(chainId)
      } finally {
        fetchingChainIds.delete(chainId)
      }
    }

    getTokens().catch(error => {
      console.error('Failed to fetch token list', { chainId, error })
    })
  }, [chainId, dispatch, fetchTokenList, tokenListSize])
}

export function useAllTokens(lowercaseAddress = false, chainId?: ChainId): TokenMap {
  const { chainId: currentChainId } = useActiveWeb3React()
  const selectedChainId = chainId || currentChainId
  useEnsureTokenList(selectedChainId)

  const mapWhitelistTokens = useSelector((state: AppState) => state.lists.mapWhitelistTokens)
  const allTokens = useDebounce(mapWhitelistTokens, 300)
  return useTokensFromMap(allTokens, lowercaseAddress, selectedChainId)
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

export const fetchListTokenByAddresses = async (address: string[], chainId: ChainId) => {
  const cached = filterTruthy(address.map(addr => findCacheToken(addr, chainId)))
  if (cached.length === address.length) return cached

  const response = await axios.get(`${KS_SETTING_API}/v1/tokens?addresses=${address}&chainIds=${chainId}`)
  const tokens = response?.data?.data?.tokens ?? []
  return filterTruthy(tokens.map(formatAndCacheToken)) as WrappedTokenInfo[]
}

export const formatAndCacheToken = (rawTokenResponse: TokenInfo) => {
  try {
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

// not use data from contract, in the future we will remove useCurrency
export function useCurrencyV2(currencyId: string | undefined, customChainId?: ChainId): Currency | null | undefined {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChainId || currentChain
  const lowercaseId = currencyId?.toLowerCase()
  const isETH = useMemo(
    () =>
      lowercaseId === NativeCurrencies[chainId].symbol?.toLowerCase() ||
      lowercaseId === 'eth' ||
      lowercaseId === ETHER_ADDRESS.toLowerCase(),
    [chainId, lowercaseId],
  )
  const whitelistTokens = useAllTokens(false, chainId)
  const tokenInWhitelist = currencyId
    ? whitelistTokens[currencyId] || whitelistTokens[currencyId?.toLowerCase()]
    : undefined

  const { data: token } = ksSettingApi.useGetTokenByAddressQuery(
    { address: isAddress(chainId, currencyId) || '', chainId },
    { skip: isETH || !!tokenInWhitelist || !isAddress(chainId, currencyId) },
  )

  return useMemo(() => {
    if (!currencyId) return
    if (isETH) return NativeCurrencies[chainId]
    return tokenInWhitelist || token
  }, [chainId, isETH, token, currencyId, tokenInWhitelist])
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
