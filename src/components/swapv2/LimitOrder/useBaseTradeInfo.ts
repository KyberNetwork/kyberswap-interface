import { Currency, WETH } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'

import { NUMBERS } from 'components/swapv2/LimitOrder/const'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'

export type BaseTradeInfo = {
  priceUsdIn: number
  priceUsdOut: number
  gasFee: number
  marketRate: number
  invertRate: number
}

// 1 knc = ?? usdt
export default function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const addresses = useMemo(() => {
    const list = [currencyIn?.wrapped.address, currencyOut?.wrapped.address]
    if (!list.includes(WETH[chainId].wrapped.address)) list.push(WETH[chainId].wrapped.address)
    return list.filter(Boolean) as string[]
  }, [currencyIn, currencyOut, chainId])

  const { data: pricesUsd, loading } = useTokenPricesWithLoading(addresses)

  const [gasFee, setGasFee] = useState(0)
  useEffect(() => {
    const nativePriceUsd = pricesUsd[WETH[chainId].wrapped.address]
    if (!library || !nativePriceUsd) return
    library
      .getSigner()
      .getGasPrice()
      .then(data => {
        const gasPrice = Number(ethers.utils.formatEther(data))
        console.log({ gasPrice, nativePriceUsd })
        if (gasPrice) setGasFee(gasPrice * nativePriceUsd * NUMBERS.GAS_AMOUNT_ETHEREUM)
      })
      .catch(e => {
        console.error(e)
      })
  }, [library, chainId, pricesUsd])

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
      gasFee,
    }
  }, [pricesUsd, currencyIn, currencyOut, gasFee])

  return { loading, tradeInfo }
}
