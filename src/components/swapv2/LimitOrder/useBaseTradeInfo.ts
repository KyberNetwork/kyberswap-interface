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
  outputAmount: any
}

const MAX_RETRY_COUNT = 2

// 1 knc = ?? usdt
export default function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const tokenInAddress = currencyIn?.isNative ? ETHER_ADDRESS : currencyIn?.wrapped.address ?? ''
  const tokenOutAddress = currencyOut?.isNative ? ETHER_ADDRESS : currencyOut?.wrapped.address ?? ''
  const amountIn = tryParseAmount('1', currencyIn)

  const mapAmountNative: any = {
    [ChainId.MATIC]: 1000,
    [ChainId.MAINNET]: 1,
    [ChainId.BSCMAINNET]: 5,
    [ChainId.ARBITRUM]: 1,
    [ChainId.OPTIMISM]: 1,
    [ChainId.AVAXMAINNET]: 20,
    [ChainId.FANTOM]: 3000,
  }

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

  const controller = useRef(new AbortController())
  const fetchData = async (url: string | null): Promise<BaseTradeInfo | undefined> => {
    if (!currencyOut || !currencyIn || !url) return

    controller.current.abort()
    controller.current = new AbortController()
    const data = await fetch(url, {
      signal: controller.current.signal,
      headers: {
        'X-Request-Id': sentryRequestId,
      },
    }).then(data => data.json())

    const { outputAmount, amountInUsd } = data
    const amountOut = TokenAmount.fromRawAmount(currencyOut, JSBI.BigInt(outputAmount))

    if (amountIn?.quotient && amountOut?.quotient) {
      return {
        price: new Price(currencyIn, currencyOut, amountIn?.quotient, amountOut?.quotient),
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
        if (!mapAmountNative[chainId] || !currencyIn || !currencyOut) return

        if (currencyIn.isNative || currencyOut.isToken) {
          const tokenNotNative = currencyIn.isNative ? currencyOut : currencyIn
          const amountA = tryParseAmount(mapAmountNative[chainId], WETH[chainId])
          const [data] = await Promise.all([
            fetchData(getApiUrl(amountA, WETH[chainId].wrapped.address, tokenNotNative.wrapped.address)),
          ])
          if (!data) return
          retryCount.current = 0
          return data
        } else {
          const amountA = tryParseAmount(mapAmountNative[chainId], WETH[chainId])
          const amountB = tryParseAmount(mapAmountNative[chainId], WETH[chainId])
          const [a, b] = await Promise.all([
            fetchData(getApiUrl(amountA, WETH[chainId].wrapped.address, currencyIn.wrapped.address)),
            fetchData(getApiUrl(amountB, WETH[chainId].wrapped.address, currencyOut.wrapped.address)),
          ])
          if (!a || !b) return undefined
          const outA = TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(b.outputAmount))
          const outB = TokenAmount.fromRawAmount(currencyOut, JSBI.BigInt(a.outputAmount))
          const rate = outB.divide(outA).toFixed(10)
          console.log('test', rate)
        }

        const data = await fetchData(url)

        retryCount.current = 0
        return data
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
