import { WETH } from '@kyberswap/ks-sdk-core'
import { BigNumber, ethers } from 'ethers'
import { useCallback, useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'

type EstimateParams = { contractAddress: string; encodedData: string; value?: BigNumber }
function useEstimateGasTxs(): (v: EstimateParams) => Promise<{ gas: BigNumber | null; gasInUsd: number | null }> {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const addressParam = useMemo(() => [WETH[chainId].wrapped.address], [chainId])
  const tokensPrices = useTokenPrices(addressParam)
  const usdPriceNative = tokensPrices[WETH[chainId].wrapped.address] ?? 0

  return useCallback(
    async ({ contractAddress, encodedData, value = BigNumber.from(0) }: EstimateParams) => {
      let accessList: any[] | undefined
      const baseTx = {
        from: account,
        to: contractAddress,
        data: encodedData,
        ...(value && !value.eq(0) ? { value: ethers.utils.hexlify(value) } : {}),
      }
      if (chainId && NETWORKS_INFO[chainId]?.accessListEnabled) {
        try {
          const al = await (library as any)?.send?.('eth_createAccessList', [baseTx, 'latest'])
          if (al && Array.isArray(al.accessList)) {
            accessList = al.accessList
          }
        } catch {}
      }
      const estimateGasOption = {
        ...baseTx,
        ...(accessList ? { accessList } : {}),
      }
      let formatGas: number | null = null
      let gas: BigNumber | null = null
      try {
        if (!account || !library) throw new Error()
        const [estimateGas, gasPrice] = await Promise.all([
          library.getSigner().estimateGas(estimateGasOption),
          library.getSigner().getGasPrice(),
        ])
        gas = gasPrice && estimateGas ? estimateGas.mul(gasPrice) : null
        formatGas = gas ? parseFloat(ethers.utils.formatEther(gas)) : null
      } catch (error) {}

      return {
        gas,
        gasInUsd: formatGas && usdPriceNative ? formatGas * usdPriceNative : null,
      }
    },
    [account, chainId, library, usdPriceNative],
  )
}
export default useEstimateGasTxs
