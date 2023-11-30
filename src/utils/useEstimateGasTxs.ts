import { WETH } from '@kyberswap/ks-sdk-core'
import { BigNumber, ethers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'

type EstimateParams = {
  contractAddress?: string
  encodedData?: string
  value?: BigNumber
  estimateGasFn?: () => Promise<BigNumber>
}
export function useLazyEstimateGasTxs(): (
  v: EstimateParams,
) => Promise<{ gas: BigNumber | null; gasInUsd: number | null }> {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const addressParam = useMemo(() => [WETH[chainId].wrapped.address], [chainId])
  const tokensPrices = useTokenPrices(addressParam)
  const usdPriceNative = tokensPrices[WETH[chainId].wrapped.address] ?? 0

  return useCallback(
    async ({ contractAddress, encodedData, value = BigNumber.from(0), estimateGasFn }: EstimateParams) => {
      let formatGas: number | null = null
      let gas: BigNumber | null = null
      try {
        if (!account || !library || (!estimateGasFn && !contractAddress)) throw new Error()
        const getGasFee = estimateGasFn
          ? estimateGasFn()
          : library.getSigner().estimateGas({ from: account, to: contractAddress, data: encodedData, value })
        const [estimateGas, gasPrice] = await Promise.all([getGasFee, library.getSigner().getGasPrice()])
        gas = gasPrice && estimateGas ? estimateGas.mul(gasPrice) : null
        formatGas = gas ? parseFloat(ethers.utils.formatEther(gas)) : null
      } catch (error) {
        console.log('estimate gas err:', error)
      }

      return {
        gas,
        gasInUsd: formatGas && usdPriceNative ? formatGas * usdPriceNative : null,
      }
    },
    [account, library, usdPriceNative],
  )
}

function useEstimateGasTxs({ contractAddress, value, encodedData, estimateGasFn }: EstimateParams) {
  const [gasInfo, setGasInfo] = useState<{ gas: BigNumber | null; gasInUsd: number | null }>({
    gas: null,
    gasInUsd: null,
  })

  const estimateGas = useLazyEstimateGasTxs()

  const params = useMemo(() => {
    return { contractAddress, value, encodedData, estimateGasFn }
  }, [contractAddress, value, encodedData, estimateGasFn])

  useEffect(() => {
    const controller = new AbortController()
    const getGasFee = async () => {
      const data = await estimateGas(params)
      if (controller.signal.aborted) return
      setGasInfo(data)
    }
    getGasFee()
    return () => controller.abort()
  }, [params, estimateGas])

  return gasInfo
}
export default useEstimateGasTxs
