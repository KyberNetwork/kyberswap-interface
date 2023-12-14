import externalApi from 'services/externalApi'

import { useActiveWeb3React } from 'hooks'
import { useETHPrice } from 'state/application/hooks'

export enum GasLevel {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast',
}

export type GasPriceData = Array<{
  level: GasLevel
  front_tx_count: number
  price: number // in wei
  estimated_seconds: number
}>

type GasPriceTrackerData = Record<
  GasLevel,
  {
    gasPriceInGwei?: number
    minimumTxFeeInUSD?: string
  }
>

const calculateGasPrices = (resp: GasPriceData, currentPrice?: string | number): GasPriceTrackerData => {
  const levels = [GasLevel.SLOW, GasLevel.NORMAL, GasLevel.FAST]

  const gasPricesInWei = levels.map(level => resp.find(item => item.level === level)?.price)
  const gasPricesInGwei = gasPricesInWei.map(price => (price ? price / 1e9 : undefined))

  const parsedCurrentPrice = currentPrice ? Number.parseFloat(String(currentPrice)) : NaN

  const costs = gasPricesInWei.map(gasPrice => {
    if (!gasPrice || Number.isNaN(parsedCurrentPrice)) {
      return ''
    }
    // 190_000 is the minimum gas units needed for a swap
    const cost = ((gasPrice / 1e18) * parsedCurrentPrice * 190_000).toFixed(2)
    return cost
  })

  return {
    [GasLevel.SLOW]: {
      gasPriceInGwei: gasPricesInGwei[0],
      minimumTxFeeInUSD: costs[0],
    },
    [GasLevel.NORMAL]: {
      gasPriceInGwei: gasPricesInGwei[1],
      minimumTxFeeInUSD: costs[1],
    },
    [GasLevel.FAST]: {
      gasPriceInGwei: gasPricesInGwei[2],
      minimumTxFeeInUSD: costs[2],
    },
  }
}

const useGasPriceFromDeBank = (): GasPriceTrackerData | undefined => {
  const { networkInfo } = useActiveWeb3React()
  const nativeTokenPriceData = useETHPrice()
  const chainSlug = networkInfo.deBankSlug
  const { data } = externalApi.useGetGasPriceQuery({ chainSlug }, { skip: !chainSlug })

  if (!data) return undefined
  return calculateGasPrices(data, nativeTokenPriceData.currentPrice)
}

export default useGasPriceFromDeBank
