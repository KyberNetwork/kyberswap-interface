import { WETH } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import { useCallback, useMemo } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
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

        let accessList: any[] | undefined
        if (NETWORKS_INFO[chainId]?.accessListEnabled) {
          try {
            const al = (await publicClient.request({
              method: 'eth_createAccessList' as any,
              params: [
                {
                  from: account,
                  to: contractAddress,
                  data: encodedData,
                  ...(txValue !== undefined ? { value: `0x${txValue.toString(16)}` } : {}),
                },
                'latest',
              ] as any,
            })) as { accessList?: any[] } | undefined
            if (al?.accessList && Array.isArray(al.accessList)) {
              accessList = al.accessList
            }
          } catch {
            // ignore; chain may not support eth_createAccessList
          }
        }

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
