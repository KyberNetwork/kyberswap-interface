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

export interface ZapResult {
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

interface ZapInToAddParams {
  pool: string
  tokenIn: string
  positionId: string
  amount: string
  zapResult: ZapResult
}

interface ZapInToMintParams {
  pool: string
  tokenIn: string
  previousTicks: [number, number]
  amount: string
  zapResult: ZapResult
  tickLower: number
  tickUpper: number
}

export function useZapInAction() {
  const { networkInfo, account } = useActiveWeb3React()
  const zapInContractAddress = (networkInfo as EVMNetworkInfo).elastic.zap?.zapIn
  const zapInContract = useContract(zapInContractAddress, ZAP_IN_ABI, true)

  const posManagerAddress = (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager
  const [slippage] = useUserSlippageTolerance()
  const deadline = useTransactionDeadline() // custom from users settings

  const estimateGasZapInPoolToAddLiquidity = useCallback(
    async ({ pool, tokenIn, positionId, amount, zapResult }: ZapInToAddParams) => {
      if (!zapInContract || !account)
        return {
          gas: undefined,
          params: undefined,
        }

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

      return {
        gas,
        params,
      }
    },
    [zapInContract, account, deadline, posManagerAddress, slippage],
  )

  const zapInPoolToAddLiquidity = useCallback(
    async (params: ZapInToAddParams) => {
      if (!zapInContract || !account) return
      const { gas, params: callParams } = await estimateGasZapInPoolToAddLiquidity(params)
      if (!gas || !callParams) return

      const { hash } = await zapInContract.zapInPoolToAddLiquidity(...callParams, {
        gasLimit: calculateGasMargin(gas),
      })
      return hash
    },
    [estimateGasZapInPoolToAddLiquidity, zapInContract, account],
  )

  const estimateGasZapInPoolToMint = useCallback(
    async ({ pool, tokenIn, previousTicks, amount, zapResult, tickLower, tickUpper }: ZapInToMintParams) => {
      if (!zapInContract || !account) return {}

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
          tickLower,
          tickUpper,
          previousTicks,
          amount,
          minLiquidity,
          maxRemainingAmount0,
          maxRemainingAmount1,
          deadline,
        ],
        1,
      ]

      const gas = await zapInContract.estimateGas.zapInPoolToMint(...params)

      return {
        gas,
        params,
      }
    },
    [zapInContract, account, deadline, posManagerAddress, slippage],
  )

  const zapInPoolToMint = useCallback(
    async (params: ZapInToMintParams) => {
      if (!zapInContract || !account) return
      const { gas, params: callParams } = await estimateGasZapInPoolToMint(params)
      if (!gas || !callParams) return

      console.log(gas.toString(), calculateGasMargin(gas).toString())
      const { hash } = await zapInContract.zapInPoolToMint(...callParams, {
        gasLimit: calculateGasMargin(gas),
      })
      return hash
    },
    [estimateGasZapInPoolToMint, account, zapInContract],
  )

  return {
    zapInPoolToAddLiquidity,
    zapInPoolToMint,
    estimateGasZapInPoolToMint,
    estimateGasZapInPoolToAddLiquidity,
  }
}
