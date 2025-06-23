import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import useDefaultsTokenFromURLSearch from 'hooks/useDefaultsTokenFromURLSearch'
import useParsedQueryString from 'hooks/useParsedQueryString'

export default function useCurrencyHandler(chainId: ChainId) {
  const [currencyIn, setCurrencyIn] = useState<Currency>(NativeCurrencies[chainId])
  const [currencyOut, setCurrencyOut] = useState<Currency>(DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] as Currency)
  const qs = useParsedQueryString()

  const { inputCurrency, outputCurrency } = useDefaultsTokenFromURLSearch(
    currencyIn,
    currencyOut,
    APP_PATHS.PROFILE_MANAGE,
    chainId,
  )

  const navigate = useNavigate()
  const replaceUrl = useCallback(() => {
    const { inputCurrency, outputCurrency, amount, ...rest } = qs
    const filteredParams = Object.fromEntries(
      Object.entries(rest).filter(([_, value]) => value !== undefined), // Remove undefined values
    ) as { [key: string]: string }
    if (!inputCurrency && !outputCurrency) return
    navigate({ search: new URLSearchParams(filteredParams).toString() }, { replace: true })
  }, [qs, navigate])

  const isInit = useRef(false)
  useEffect(() => {
    if (!isInit.current) {
      // skip the first time and a bit delay
      setTimeout(() => (isInit.current = true), 1000)
      return
    }
    replaceUrl()
    setCurrencyIn(NativeCurrencies[chainId])
    setCurrencyOut(DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] as Currency)
  }, [chainId, replaceUrl])

  useEffect(() => {
    if (inputCurrency && !currencyIn?.equals(inputCurrency)) {
      setCurrencyIn(inputCurrency ?? undefined)
    }
  }, [inputCurrency, currencyIn])

  useEffect(() => {
    if (outputCurrency && !currencyOut?.equals(outputCurrency)) {
      setCurrencyOut(outputCurrency ?? undefined)
    }
  }, [outputCurrency, currencyOut])

  const switchCurrency = useCallback(() => {
    setCurrencyIn(currencyOut)
    setCurrencyOut(currencyIn)
  }, [currencyOut, currencyIn])

  const onChangeCurrencyIn = useCallback(
    (c: Currency) => {
      if (currencyOut?.equals(c)) {
        switchCurrency()
        return
      }
      setCurrencyIn(c)
      replaceUrl()
    },
    [currencyOut, replaceUrl, switchCurrency],
  )
  const onChangeCurrencyOut = useCallback(
    (c: Currency) => {
      if (currencyIn?.equals(c)) {
        switchCurrency()
        return
      }
      setCurrencyOut(c)
      replaceUrl()
    },
    [currencyIn, replaceUrl, switchCurrency],
  )

  return {
    currencyIn,
    currencyOut,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    inputAmount: (qs.amount as string) ?? '1',
  }
}
