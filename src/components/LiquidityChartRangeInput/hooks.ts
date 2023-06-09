import { Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount, computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'

import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { usePoolActiveLiquidity } from 'hooks/usePoolTickData'

import { ChartEntry } from './types'

interface TickProcessed {
  liquidityActive: JSBI
  price0: string
}

export function useDensityChartData({
  poolAddress,
  currencyA,
  currencyB,
  feeAmount,
}: {
  poolAddress: string | undefined
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount: FeeAmount | undefined
}): {
  isLoading: boolean
  isUninitialized: boolean
  isError: boolean
  error: any
  formattedData: ChartEntry[] | undefined
} {
  const chainId = currencyA?.chainId

  const computedPoolAddress: string | undefined = useMemo(() => {
    if (!chainId || !isEVM(chainId) || !currencyA || !currencyB || !feeAmount) {
      return undefined
    }

    const proAmmCoreFactoryAddress = NETWORKS_INFO[chainId].elastic.coreFactory
    const param = {
      factoryAddress: proAmmCoreFactoryAddress,
      tokenA: currencyA.wrapped,
      tokenB: currencyB.wrapped,
      fee: feeAmount,
      initCodeHashManualOverride: NETWORKS_INFO[chainId].elastic.initCodeHash,
    }

    return computePoolAddress(param)
  }, [chainId, currencyA, currencyB, feeAmount])

  const { isLoading, isUninitialized, isError, error, data } = usePoolActiveLiquidity(
    poolAddress || computedPoolAddress || '',
    currencyA,
    currencyB,
    feeAmount,
  )

  const formatData = useCallback(() => {
    if (!data?.length) {
      return undefined
    }

    const newData: ChartEntry[] = []

    for (let i = 0; i < data.length; i++) {
      const t: TickProcessed = data[i]

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat(t.price0),
      }

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry)
      }
    }

    return newData
  }, [data])

  return useMemo(() => {
    return {
      isLoading,
      isUninitialized,
      isError,
      error,
      formattedData: !isLoading && !isUninitialized ? formatData() : undefined,
    }
  }, [isLoading, isUninitialized, isError, error, formatData])
}
