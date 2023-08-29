import { Currency, CurrencyAmount, Percent } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { useCallback, useMemo } from 'react'

import ZAP_HELPER_ABI from 'constants/abis/elastic-zap/zap-helper.json'
import ZAP_IN_ABI from 'constants/abis/elastic-zap/zap-in.json'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useContract, useContractForReading } from 'hooks/useContract'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { basisPointsToPercent, calculateGasMargin } from 'utils'

interface ZapResult {
  liquidity: BigNumber
  usedAmount0: BigNumber
  usedAmount1: BigNumber
  remainingAmount0: BigNumber
  remainingAmount1: BigNumber
}

export function useZapInPoolResult(params?: {
  poolAddress: string
  tokenIn: string
  amountIn: CurrencyAmount<Currency>
  tickLower: number
  tickUpper: number
}): {
  loading: boolean
  result: ZapResult | undefined
} {
  const { networkInfo } = useActiveWeb3React()
  const zapHelperContract = useContractForReading((networkInfo as EVMNetworkInfo).elastic.zap?.helper, ZAP_HELPER_ABI)

  const callParams = useMemo(
    () =>
      params
        ? [
            params.poolAddress,
            params.tokenIn,
            params.amountIn.quotient.toString(),
            1,
            params.tickLower,
            params.tickUpper,
          ]
        : undefined,
    [params],
  )

  const { loading, result } = useSingleCallResult(
    params ? zapHelperContract : undefined,
    'getZapInPoolResults',
    callParams,
  )

  return {
    loading,
    result: result?.results,
  }
}

export function useZapInAction() {
  const { networkInfo, account } = useActiveWeb3React()
  const zapInContractAddress = (networkInfo as EVMNetworkInfo).elastic.zap?.zapIn
  const zapInContract = useContract(zapInContractAddress, ZAP_IN_ABI, true)

  const posManagerAddress = (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager
  const [slippage] = useUserSlippageTolerance()
  const deadline = useTransactionDeadline() // custom from users settings

  const zapInPoolToAddLiquidity = useCallback(
    async ({
      pool,
      tokenIn,
      positionId,
      amount,
      zapResult,
    }: {
      pool: string
      tokenIn: string
      positionId: string
      amount: string
      zapResult: ZapResult
    }) => {
      if (!zapInContract || !account) return

      const minLiquidity = zapResult.liquidity.sub(
        zapResult.liquidity.mul(BigNumber.from(basisPointsToPercent(slippage).quotient.toString())),
      )

      const maxRemainingAmount0 = zapResult.remainingAmount0.mul(
        BigNumber.from(basisPointsToPercent(slippage).add(new Percent(1)).quotient.toString()),
      )
      const maxRemainingAmount1 = zapResult.remainingAmount1.mul(
        BigNumber.from(basisPointsToPercent(slippage).add(new Percent(1)).quotient.toString()),
      )

      const params = [
        [
          posManagerAddress,
          pool,
          account,
          tokenIn,
          positionId,
          amount,
          minLiquidity,
          maxRemainingAmount0,
          maxRemainingAmount1,
          deadline,
        ],
        1,
      ]

      const gas = await zapInContract.estimateGas.zapInPoolToAddLiquidity(...params)

      const { hash } = await zapInContract.zapInPoolToAddLiquidity(...params, {
        gasLimit: calculateGasMargin(gas),
      })
      return hash
    },
    [zapInContract, account, deadline, posManagerAddress, slippage],
  )

  return {
    zapInPoolToAddLiquidity,
  }
}
