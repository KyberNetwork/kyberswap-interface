import { WETH } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import { useCallback, useMemo } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import { useActiveWeb3React } from 'hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { createAccessListIfEnabled } from 'utils/accessList'
import { Address, Hex, PublicClient, formatEther } from 'utils/viem'

type EstimateParams = { contractAddress: string; encodedData: string; value?: bigint }
function useEstimateGasTxs(): (v: EstimateParams) => Promise<{ gas: bigint | null; gasInUsd: number | null }> {
  const { account, chainId } = useActiveWeb3React()

  const addressParam = useMemo(() => [WETH[chainId].wrapped.address], [chainId])
  const tokensPrices = useTokenPrices(addressParam)
  const usdPriceNative = tokensPrices[WETH[chainId].wrapped.address] ?? 0

  return useCallback(
    async ({ contractAddress, encodedData, value = 0n }: EstimateParams) => {
      let formatGas: number | null = null
      let gas: bigint | null = null
      try {
        if (!account) throw new Error('No account')
        const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
        if (!publicClient) throw new Error('Public client unavailable')

        const txValue = value !== 0n ? value : undefined

        const accessList = await createAccessListIfEnabled(publicClient, chainId, {
          from: account,
          to: contractAddress,
          data: encodedData,
          value: txValue,
        })

        const [estimateGas, gasPrice] = await Promise.all([
          (publicClient as PublicClient).estimateGas({
            account: account as Address,
            to: contractAddress as Address,
            data: encodedData as Hex,
            ...(txValue !== undefined ? { value: txValue } : {}),
            ...(accessList ? { accessList } : {}),
          }),
          publicClient.getGasPrice(),
        ])
        gas = estimateGas * gasPrice
        formatGas = parseFloat(formatEther(gas))
      } catch (error) {}

      return {
        gas,
        gasInUsd: formatGas && usdPriceNative ? formatGas * usdPriceNative : null,
      }
    },
    [account, chainId, usdPriceNative],
  )
}
export default useEstimateGasTxs
