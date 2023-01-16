import {
  ChainId,
  Currency,
  CurrencyAmount,
  NativeCurrency,
  Price,
  Token,
  TokenAmount,
  WETH,
} from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { stringify } from 'querystring'
import { useRef } from 'react'
import useSWR from 'swr'

import { ETHER_ADDRESS, ZERO_ADDRESS, sentryRequestId } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { tryParseAmount } from 'state/swap/hooks'

type BaseTradeInfo = {
  price: Price<Currency, Currency>
  amountInUsd: number
  outputAmount: string
}

const MAX_RETRY_COUNT = 2

// todo danh move to network.ts
const MAP_AMOUNT_NATIVE: { [chain: number]: string } = {
  [ChainId.MATIC]: '1000',
  [ChainId.MAINNET]: '1',
  [ChainId.BSCMAINNET]: '5',
  [ChainId.ARBITRUM]: '1',
  [ChainId.OPTIMISM]: '1',
  [ChainId.AVAXMAINNET]: '20',
  [ChainId.FANTOM]: '3000',
}

// 1 knc = ?? usdt
export default function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { account, chainId } = useActiveWeb3React()
  const tokenInAddress = currencyIn?.isNative ? ETHER_ADDRESS : currencyIn?.wrapped.address ?? ''
  const tokenOutAddress = currencyOut?.isNative ? ETHER_ADDRESS : currencyOut?.wrapped.address ?? ''
  const amountIn = tryParseAmount('1', currencyIn)

  const getApiUrl = (
    amount?: CurrencyAmount<NativeCurrency | Token> | undefined,
    addressIn?: string,
    addressOut?: string,
  ) => {
    return tokenInAddress && tokenOutAddress && chainId
      ? `${NETWORKS_INFO[chainId].routerUri}?${stringify({
          tokenIn: (addressIn || tokenInAddress).toLowerCase(),
          tokenOut: (addressOut || tokenOutAddress).toLowerCase(),
          amountIn: (amount || amountIn)?.quotient?.toString() ?? '',
          to: account ?? ZERO_ADDRESS,
        })}`
      : null
  }

  // todo danh use controller later, bị dí
  // const controller = useRef(new AbortController())
  const fetchData = async (
    url: string | null,
    amount: CurrencyAmount<NativeCurrency | Token> | undefined,
    currencyIn: Currency,
    currencyOut: Currency,
  ): Promise<BaseTradeInfo | undefined> => {
    if (!currencyOut || !currencyIn || !url) return

    // controller.current.abort()
    // controller.current = new AbortController()
    const data = await fetch(url, {
      // signal: controller.current.signal,
      headers: {
        'X-Request-Id': sentryRequestId,
      },
    }).then(data => data.json())

    const { outputAmount, amountInUsd } = data
    const amountOut = TokenAmount.fromRawAmount(currencyOut, JSBI.BigInt(outputAmount))

    if (amount?.quotient && amountOut?.quotient) {
      return {
        price: new Price(currencyIn, currencyOut, amount?.quotient, amountOut?.quotient),
        amountInUsd,
        outputAmount,
      }
    }
    return
  }

  const retryCount = useRef(0)
  const { data, isValidating } = useSWR(
    getApiUrl(),
    async url => {
      try {
        if (!MAP_AMOUNT_NATIVE[chainId] || !currencyIn || !currencyOut) return
        const isNative = (currency: Currency) => currency.isNative || currencyIn.equals(WETH[chainId])
        if (isNative(currencyIn)) {
          const amountA = tryParseAmount(MAP_AMOUNT_NATIVE[chainId], WETH[chainId])
          const customUrl = getApiUrl(amountA, ETHER_ADDRESS, currencyOut.wrapped.address)
          const [dataCompareEth, data2] = await Promise.all([
            fetchData(customUrl, amountA, currencyIn, currencyOut),
            fetchData(url, amountIn, currencyIn, currencyOut),
          ])
          if (!dataCompareEth || !data2) return
          retryCount.current = 0
          return { ...dataCompareEth, amountInUsd: data2.amountInUsd }
        }
        if (isNative(currencyOut)) {
          const amountA = tryParseAmount(MAP_AMOUNT_NATIVE[chainId], WETH[chainId])
          const [dataCompareEth, data2] = await Promise.all([
            fetchData(
              getApiUrl(amountA, ETHER_ADDRESS, currencyIn.wrapped.address),
              amountA,
              WETH[chainId],
              currencyIn,
            ),
            fetchData(url, amountIn, currencyIn, currencyOut),
          ])
          if (!dataCompareEth || !data2) return
          retryCount.current = 0
          return {
            ...dataCompareEth,
            price: dataCompareEth?.price.invert(),
            amountInUsd: data2.amountInUsd,
          }
        }
        const amountA = tryParseAmount(MAP_AMOUNT_NATIVE[chainId], WETH[chainId])

        const [dataCompareEth1, dataCompareEth2, data] = await Promise.all([
          fetchData(getApiUrl(amountA, ETHER_ADDRESS, currencyIn.wrapped.address), amountA, WETH[chainId], currencyIn),
          fetchData(
            getApiUrl(amountA, ETHER_ADDRESS, currencyOut.wrapped.address),
            amountA,
            WETH[chainId],
            currencyOut,
          ),
          fetchData(url, amountIn, currencyIn, currencyOut),
        ])

        if (!dataCompareEth1 || !dataCompareEth2 || !data) return
        const amountOut1 = TokenAmount.fromRawAmount(currencyOut, JSBI.BigInt(dataCompareEth1.outputAmount))
        const amountOut2 = TokenAmount.fromRawAmount(currencyOut, JSBI.BigInt(dataCompareEth2.outputAmount))

        retryCount.current = 0
        return { ...data, price: new Price(currencyIn, currencyOut, amountOut1.quotient, amountOut2.quotient) }
      } catch (error) {
        retryCount.current++
        if (retryCount.current <= MAX_RETRY_COUNT) {
          throw new Error(error) // retry max RETRY_COUNT times
        }
        console.error(error)
      }
      return
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: MAX_RETRY_COUNT,
      errorRetryInterval: 1500,
    },
  )

  return { loading: isValidating, tradeInfo: data }
}
