import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'
import { parseGetRouteResponse } from 'services/route/utils'

import useGetRoute, { ArgsGetRoute, useGetRouteSolana } from 'components/SwapForm/hooks/useGetRoute'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'

export type BaseTradeInfo = {
  priceUsdIn: number
  priceUsdOut: number
  marketRate: number
  invertRate: number
  nativePriceUsd: number
}

// 1 knc = ?? usdt
function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined, customChain?: ChainId) {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const addresses = useMemo(() => {
    const list = [currencyIn?.wrapped.address, currencyOut?.wrapped.address]
    if (!list.includes(WETH[chainId].wrapped.address)) list.push(WETH[chainId].wrapped.address)
    return list.filter(Boolean) as string[]
  }, [currencyIn, currencyOut, chainId])

  const { data: pricesUsd, loading, refetch } = useTokenPricesWithLoading(addresses, chainId)

  const nativePriceUsd = pricesUsd[WETH[chainId].wrapped.address]

  const tradeInfo: BaseTradeInfo | undefined = useMemo(() => {
    if (!currencyIn || !currencyOut) return
    const priceUsdIn = pricesUsd[currencyIn?.wrapped.address]
    const priceUsdOut = pricesUsd[currencyOut?.wrapped.address]
    if (!priceUsdIn || !priceUsdOut) return

    return {
      priceUsdIn,
      priceUsdOut,
      marketRate: priceUsdIn / priceUsdOut,
      invertRate: priceUsdOut / priceUsdIn,
      nativePriceUsd,
    }
  }, [pricesUsd, currencyIn, currencyOut, nativePriceUsd])

  return { loading, tradeInfo, refetch }
}

export function useBaseTradeInfoLimitOrder(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { loading, tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)
  const debouncedLoading = useDebounce(loading, 100) // prevent flip flop UI when loading from true to false
  return { loading: loading || debouncedLoading, tradeInfo }
}

export const useBaseTradeInfoWithAggregator = (args: ArgsGetRoute) => {
  const { currencyIn, currencyOut, customChain } = args
  const { fetcher: getRouteEvm, result } = useGetRoute(args)
  const { fetcher: getRouteSolana, result: executionPriceSolana } = useGetRouteSolana(args)
  const isSolana = customChain === ChainId.SOLANA

  const getRoute = isSolana ? getRouteSolana : getRouteEvm

  useEffect(() => {
    getRoute()
  }, [getRoute])

  const executionPrice = useMemo(() => {
    if (!result?.data?.data || result.error || !currencyIn || !currencyOut) {
      return undefined
    }
    return parseGetRouteResponse(result.data.data, currencyIn, currencyOut)?.routeSummary?.executionPrice
  }, [currencyIn, currencyOut, result])

  return {
    fetcher: getRoute,
    result: (isSolana ? executionPriceSolana : executionPrice) || undefined,
  }
}
