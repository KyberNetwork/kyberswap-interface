import { BigNumber } from '@ethersproject/bignumber'
import { readContract } from '@wagmi/core'
import { useCallback, useEffect, useState } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import ZAP_STATIC_FEE_ABI from 'constants/abis/zap-static-fee.json'
import ZAP_ABI from 'constants/abis/zap.json'
import { useActiveWeb3React } from 'hooks'
import { bigIntToBigNumber } from 'utils/migration'
import { Abi, Address } from 'utils/viem'

const useZap = (isStaticFeeContract: boolean, isOldStaticFeeContract: boolean) => {
  const { networkInfo, chainId } = useActiveWeb3React()

  const zapAddress = (
    isStaticFeeContract
      ? isOldStaticFeeContract
        ? networkInfo.classic.oldStatic?.zap
        : networkInfo.classic.static.zap
      : networkInfo.classic.dynamic?.zap
  ) as string | undefined

  const zapAbi = (isStaticFeeContract && !isOldStaticFeeContract ? ZAP_STATIC_FEE_ABI : ZAP_ABI) as Abi

  const callZapView = useCallback(
    async (functionName: 'calculateZapInAmounts' | 'calculateZapOutAmount', args: readonly unknown[]) => {
      if (!zapAddress) throw new Error('Zap contract address unavailable')
      const data = await readContract(wagmiConfig, {
        address: zapAddress as Address,
        abi: zapAbi,
        functionName,
        args: args as any,
        chainId: chainId as number,
      })
      return data
    },
    [chainId, zapAbi, zapAddress],
  )

  const calculateZapInAmounts = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, userIn: BigNumber) => {
      const userInBig = BigInt(userIn.toString())
      try {
        return await callZapView(
          'calculateZapInAmounts',
          isStaticFeeContract && !isOldStaticFeeContract
            ? [networkInfo.classic.static.factory, tokenIn, tokenOut, pool, userInBig]
            : [tokenIn, tokenOut, pool, userInBig],
        )
      } catch (err) {
        console.error(err)
        throw err
      }
    },
    [callZapView, networkInfo, isStaticFeeContract, isOldStaticFeeContract],
  )

  const calculateZapOutAmount = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, lpQty: BigNumber) => {
      const lpQtyBig = BigInt(lpQty.toString())
      try {
        return await callZapView(
          'calculateZapOutAmount',
          isStaticFeeContract && !isOldStaticFeeContract
            ? [networkInfo.classic.static.factory, tokenIn, tokenOut, pool, lpQtyBig]
            : [tokenIn, tokenOut, pool, lpQtyBig],
        )
      } catch (err) {
        console.error(err)
        throw err
      }
    },
    [callZapView, networkInfo, isStaticFeeContract, isOldStaticFeeContract],
  )

  return {
    calculateZapInAmounts,
    calculateZapOutAmount,
  }
}

export const useZapOutAmount = (
  isStaticFeeContract: boolean,
  isOldStaticFeeContract: boolean,
  tokenIn?: string,
  tokenOut?: string,
  pool?: string,
  lpQty?: BigNumber,
) => {
  const { calculateZapOutAmount } = useZap(isStaticFeeContract, isOldStaticFeeContract)
  const [result, setResult] = useState<{ amount: BigNumber; error?: any }>({
    amount: BigNumber.from(0),
    error: undefined,
  })

  useEffect(() => {
    async function handleCalculateZapOutAmount() {
      if (!lpQty || lpQty.eq(0)) {
        setResult({
          amount: BigNumber.from(0),
          error: undefined,
        })

        return
      }

      try {
        if (tokenIn && tokenOut && pool && lpQty?.gt(0)) {
          const raw = (await calculateZapOutAmount(tokenIn, tokenOut, pool, lpQty)) as bigint
          setResult({
            amount: bigIntToBigNumber(raw),
            error: undefined,
          })
        }
      } catch (err) {
        setResult({
          amount: BigNumber.from(0),
          error: err as Error,
        })
      }
    }

    handleCalculateZapOutAmount()
  }, [calculateZapOutAmount, tokenIn, tokenOut, pool, lpQty])

  return result
}
