import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import { useCallback, useMemo, useState } from 'react'

import { GAS_AMOUNT_ETHEREUM } from 'components/swapv2/LimitOrder/const'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useInterval from 'hooks/useInterval'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'

export type BaseTradeInfo = {
  priceUsdIn: number
  priceUsdOut: number
  marketRate: number
  invertRate: number
  nativePriceUsd: number
}

// 1 knc = ?? usdt
export default function useBaseTradeInfo(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  customChain?: ChainId,
) {
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

export type BaseTradeInfoLO = BaseTradeInfo & {
  gasFee: number
}

export function useBaseTradeInfoLimitOrder(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { library } = useWeb3React()

  const [gasFee, setGasFee] = useState(0)
  const { loading, tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)
  const nativePriceUsd = tradeInfo?.nativePriceUsd

  const fetchGasFee = useCallback(() => {
    if (!library || !nativePriceUsd) return
    library
      .getSigner()
      .getGasPrice()
      .then(data => {
        const gasPrice = Number(ethers.utils.formatEther(data))
        if (gasPrice) setGasFee(gasPrice * nativePriceUsd * GAS_AMOUNT_ETHEREUM)
      })
      .catch(e => {
        console.error('fetchGasFee', e)
      })
  }, [library, nativePriceUsd])

  useInterval(fetchGasFee, nativePriceUsd ? 15_000 : 2000)

  return { loading, tradeInfo: { ...tradeInfo, gasFee } as BaseTradeInfoLO }
}
