import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { stringify } from 'querystring'
import { useCallback, useEffect, useRef } from 'react'
import { Params, useLocation, useNavigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { filterTokensWithExactKeyword } from 'utils/filtering'
import { convertToSlug, getSymbolSlug } from 'utils/string'
import { convertSymbol } from 'utils/tokenInfo'

import { useAllTokens, useIsLoadedTokenDefault } from './Tokens'
import { useChangeNetwork } from './useChangeNetwork'
import useParsedQueryString from './useParsedQueryString'

type TokenSymbolUrl = {
  fromCurrency: string
  toCurrency: string
  network: string
}
const getUrlMatchParams = (params: Params): TokenSymbolUrl => {
  const fromCurrency = (params.fromCurrency || '').toLowerCase()
  const toCurrency = (params.toCurrency || '').toLowerCase()
  const network: string = convertToSlug(params.network || '')
  return { fromCurrency, toCurrency, network }
}

const getTokenPath = (symA: string, symB: string) => [symA, symB].join('-to-')

/** check url params format `/swap/network/x-to-y` and then auto select token input */
export default function useSyncTokenSymbolToUrl(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  onCurrencySelection: (fromToken: Currency | undefined, toToken?: Currency, amount?: string) => void,
  isSelectCurrencyManual: boolean,
  path: string,
) {
  const params = useParams()
  const { fromCurrency, toCurrency, network } = getUrlMatchParams(params)
  const { chainId } = useActiveWeb3React()
  const navigateFn = useNavigate()
  const qs = useParsedQueryString()
  const { pathname } = useLocation()
  const defaultTokens = useAllTokens()
  const isLoadedTokenDefault = useIsLoadedTokenDefault()
  const changeNetwork = useChangeNetwork()
  const curPath = pathname.startsWith(APP_PATHS.SWAP) ? APP_PATHS.SWAP : APP_PATHS.LIMIT

  const isSamePath = pathname.startsWith(path) // todo danh refactor, change network có vẻ sai,

  const navigate = useCallback(
    (url: string) => {
      const { networkId, inputCurrency, outputCurrency, ...newQs } = qs
      navigateFn(`${curPath}${url ? `/${url}` : ''}?${stringify(newQs)}`) // keep query params
    },
    [navigateFn, qs, curPath],
  )

  const findTokenBySymbol = useCallback(
    (keyword: string, chainId: ChainId) => {
      const nativeToken = NativeCurrencies[chainId]
      if (keyword === getSymbolSlug(nativeToken)) {
        return nativeToken
      }
      return filterTokensWithExactKeyword(chainId, Object.values(defaultTokens), keyword)[0]
    },
    [defaultTokens],
  )

  const syncTokenSymbolToUrl = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
      const symbolIn = getSymbolSlug(currencyIn)
      const symbolOut = getSymbolSlug(currencyOut)
      if (symbolIn && symbolOut && chainId) {
        navigate(`${NETWORKS_INFO[chainId].route}/${getTokenPath(symbolIn, symbolOut)}`)
      }
    },
    [navigate, chainId],
  )

  const findTokenPairFromUrl = useCallback(
    (chainId: ChainId) => {
      if (!fromCurrency || !network) return

      const compareNetwork = NETWORKS_INFO[chainId].route

      if (compareNetwork && network !== compareNetwork) {
        // when select change network => force get new network
        navigate(`${network}/${getTokenPath(fromCurrency, toCurrency)}`)
        return
      }

      const isSame = fromCurrency && fromCurrency === toCurrency
      if (!toCurrency || isSame) {
        // net/symbol
        const fromToken = findTokenBySymbol(fromCurrency, chainId)
        if (fromToken) {
          onCurrencySelection(fromToken)
          if (isSame) navigate(`${network}/${fromCurrency}`)
        } else navigate('')
        return
      }

      // sym-to-sym
      const fromToken = findTokenBySymbol(convertSymbol(network, fromCurrency), chainId)
      const toToken = findTokenBySymbol(convertSymbol(network, toCurrency), chainId)

      if (!toToken || !fromToken) {
        navigate('')
        return
      }
      onCurrencySelection(fromToken, toToken)
    },
    [findTokenBySymbol, navigate, onCurrencySelection, fromCurrency, network, toCurrency],
  )

  const refChain = useRef<ChainId>()
  const checkChangeNetwork = useCallback(() => {
    // check case:  `/swap|limit/net/sym-to-sym` is valid and switch network
    if (!fromCurrency || !network) return
    const findChainId = SUPPORTED_NETWORKS.find(chainId => NETWORKS_INFO[chainId].route === network)
    if (!findChainId) {
      return navigate('')
    }
    if (findChainId !== chainId) {
      changeNetwork(
        // todo danh test
        findChainId,
        () => {
          refChain.current = findChainId
        },
        () => navigate(''),
      )
    } else {
      refChain.current = chainId
    }
  }, [navigate, network, chainId, changeNetwork, fromCurrency])

  useEffect(() => {
    if (refChain.current && Object.values(defaultTokens)[0]?.chainId === refChain.current) {
      // call once
      const chainId: ChainId = refChain.current
      setTimeout(() => {
        findTokenPairFromUrl(chainId) // todo danh
      })
      refChain.current = undefined
    }
    // eslint-disable-next-line
  }, [defaultTokens, findTokenPairFromUrl, refChain.current]) // when refChain.current or defaultTokens change trigger effect

  const isCheckNetwork = useRef(false)
  // when visit /swap|limit/net/sym-to-sym , check change network if needed
  useEffect(() => {
    if (!isSamePath || isCheckNetwork.current || !isLoadedTokenDefault) return
    checkChangeNetwork() // call once
    isCheckNetwork.current = true
  }, [isSamePath, checkChangeNetwork, isLoadedTokenDefault])

  useEffect(() => {
    // when token change, sync symbol to url
    if (isSelectCurrencyManual && isLoadedTokenDefault && isSamePath) {
      syncTokenSymbolToUrl(currencyIn, currencyOut)
    }
  }, [currencyIn, currencyOut, isSelectCurrencyManual, syncTokenSymbolToUrl, isLoadedTokenDefault, isSamePath])
}
