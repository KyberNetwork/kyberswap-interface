import { BigNumber } from '@ethersproject/bignumber'
import { WETH } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import { useCallback, useMemo } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'

import { bigIntToBigNumber, bigNumberToBigInt } from './migration'
import { Address, Hex, formatEther } from './viem'

type EstimateParams = { contractAddress: string; encodedData: string; value?: BigNumber }
function useEstimateGasTxs(): (v: EstimateParams) => Promise<{ gas: BigNumber | null; gasInUsd: number | null }> {
  const { account, chainId } = useActiveWeb3React()

  const addressParam = useMemo(() => [WETH[chainId].wrapped.address], [chainId])
  const tokensPrices = useTokenPrices(addressParam)
  const usdPriceNative = tokensPrices[WETH[chainId].wrapped.address] ?? 0

  return useCallback(
    async ({ contractAddress, encodedData, value = BigNumber.from(0) }: EstimateParams) => {
      let formatGas: number | null = null
      let gas: BigNumber | null = null
      try {
        if (!account) throw new Error('No account')
        const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
        if (!publicClient) throw new Error('Public client unavailable')

        const txValue = value && !value.eq(0) ? BigInt(value.toString()) : undefined

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
          (publicClient as any).estimateGas({
            account: account as Address,
            to: contractAddress as Address,
            data: encodedData as Hex,
            ...(txValue !== undefined ? { value: txValue } : {}),
            ...(accessList ? { accessList } : {}),
          }) as Promise<bigint>,
          (publicClient as any).getGasPrice() as Promise<bigint>,
        ])
        const estimateGasBN = bigIntToBigNumber(estimateGas)
        const gasPriceBN = bigIntToBigNumber(gasPrice)
        gas = gasPriceBN && estimateGasBN ? estimateGasBN.mul(gasPriceBN) : null
        formatGas = gas ? parseFloat(formatEther(bigNumberToBigInt(gas))) : null
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
