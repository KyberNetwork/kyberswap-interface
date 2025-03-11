import { Currency } from '@kyberswap/ks-sdk-core'
import { stringify } from 'querystring'
import { useCallback, useEffect } from 'react'
import { Params, useLocation, useNavigate } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { convertToSlug, getSymbolSlug } from 'utils/string'

import { useIsLoadedTokenDefault } from './Tokens'
import useParsedQueryString from './useParsedQueryString'

type TokenSymbolParams = {
  fromCurrency: string
  toCurrency: string
  network: string
}

export const getUrlMatchParams = (params: Params): TokenSymbolParams => {
  const currencyParam = (params.currency || '').toLowerCase()
  const network: string = convertToSlug(params.network || '')

  let fromCurrency = '',
    toCurrency = ''

  const matches = currencyParam.split('-to-')
  fromCurrency ||= matches[0]
  toCurrency ||= matches[1]
  return { fromCurrency, toCurrency, network }
}

const getTokenPath = (symA: string, symB: string) => [symA, symB].join('-to-')

/** check url params format `/network/x-to-y` and then auto select token input */
export default function useSyncTokenSymbolToUrl(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  onCurrencySelection: (fromToken: Currency | undefined, toToken?: Currency, amount?: string) => void,
  isSelectCurrencyManual: boolean,
  disabled = false,
) {
  const { chainId } = useActiveWeb3React()
  const navigate = useNavigate()
  const qs = useParsedQueryString()
  const { pathname } = useLocation()
  const isLoadedTokenDefault = useIsLoadedTokenDefault()

  const currentPath = [APP_PATHS.SWAP, APP_PATHS.LIMIT].find(path => pathname.startsWith(path)) || APP_PATHS.SWAP

  const redirect = useCallback(
    (url: string) => {
      const { inputCurrency, outputCurrency, ...newQs } = qs
      navigate(`${currentPath}${url ? `/${url}` : ''}?${stringify(newQs)}`, { replace: true }) // keep query params
    },
    [navigate, qs, currentPath],
  )

  const syncTokenSymbolToUrl = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
      const symbolIn = getSymbolSlug(currencyIn)
      const symbolOut = getSymbolSlug(currencyOut)
      if (symbolIn && symbolOut && chainId) {
        redirect(`${NETWORKS_INFO[chainId].route}/${getTokenPath(symbolIn, symbolOut)}`)
      }
    },
    [redirect, chainId],
  )

  // when token change, sync symbol to url
  useEffect(() => {
    if (isLoadedTokenDefault && isSelectCurrencyManual && !disabled) {
      syncTokenSymbolToUrl(currencyIn, currencyOut)
    }
  }, [isLoadedTokenDefault, isSelectCurrencyManual, disabled, currencyIn, currencyOut, syncTokenSymbolToUrl])
}
