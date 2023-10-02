import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { defaultAbiCoder as abiEncoder } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'

import ZAP_ROUTER_ABI from 'constants/abis/elastic-zap/router.json'
import ZAP_HELPER_ABI from 'constants/abis/elastic-zap/zap-helper.json'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useContract, useContractForReading } from 'hooks/useContract'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin } from 'utils'

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
            // Aggregator amount out, hardcode 0 for now
            '0',
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
  const { router: zapRouterAddress, validator, executor } = (networkInfo as EVMNetworkInfo).elastic?.zap || {}
  const zapRouterContract = useContract(zapRouterAddress, ZAP_ROUTER_ABI, true)

  const posManagerAddress = (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager
  const [slippage] = useUserSlippageTolerance()
  const deadline = useTransactionDeadline() // custom from users settings

  const zapIn = useCallback(
    async (
      {
        tokenId = 0,
        tokenIn,
        amountIn,
        usedAmount0,
        usedAmount1,
        poolAddress,
        tickUpper,
        tickLower,
        poolInfo,
        tickPrevious,
        liquidity,
      }: {
        tokenId?: number | string
        tokenIn: string
        amountIn: string
        usedAmount0: string
        usedAmount1: string
        poolAddress: string
        tickLower: number
        tickUpper: number
        poolInfo: {
          token0: string
          token1: string
          fee: number
        }
        tickPrevious: [number, number]
        liquidity: string
      },
      options: {
        zapWithNative: boolean
        estimateOnly?: boolean
      },
    ) => {
      if (zapRouterContract) {
        const minLiquidity = JSBI.divide(
          JSBI.multiply(JSBI.BigInt(liquidity), JSBI.BigInt(10000 - slippage)),
          JSBI.BigInt(10000),
        ).toString()

        const zapInfo = abiEncoder.encode(['address', 'address', 'uint256'], [poolAddress, posManagerAddress, tokenId])
        const extraData = tokenId
          ? abiEncoder.encode(['uint128'], [minLiquidity])
          : abiEncoder.encode(['address', 'int24', 'int24', 'uint128'], [account, tickLower, tickUpper, minLiquidity])

        const zeros = '0'.repeat(128)
        const minZapAmount0 = JSBI.divide(
          JSBI.multiply(JSBI.BigInt(usedAmount0), JSBI.BigInt(slippage)),
          JSBI.BigInt(10000),
        ).toString(2)

        // temporary hardcode for 0
        const minZapAmount1 = JSBI.divide(
          JSBI.multiply(JSBI.BigInt(usedAmount1), JSBI.BigInt(slippage)),
          JSBI.BigInt(10000),
        ).toString(2)

        const minZapAmount = JSBI.BigInt(
          parseInt((zeros + minZapAmount0).slice(-128) + (zeros + minZapAmount1).slice(-128), 2),
        ).toString()

        const zapExecutorData = abiEncoder.encode(
          [
            'address',
            'address',
            'tupple(address token0,int24 fee,address token1)',
            'uint256',
            'address',
            'uint256',
            'uint256',
            'int24',
            'int24',
            'int24[2]',
            'uint128',
            'bytes',
          ],
          [
            posManagerAddress,
            poolAddress,
            { token0: poolInfo.token0, fee: poolInfo.fee, token1: poolInfo.token1 },
            tokenId,
            account,
            1,
            minZapAmount,
            tickLower,
            tickUpper,
            tickPrevious,
            minLiquidity,
            '0x',
          ],
        )

        const executorData = abiEncoder.encode(
          ['uint8', 'address', 'uint256', 'bytes', 'bytes', 'bytes'],
          [
            0,
            tokenIn,
            amountIn,
            '0x',
            '0x',
            // hardcode for dynamic field (poolInfo) in contract
            '0x0000000000000000000000000000000000000000000000000000000000000020' + zapExecutorData.slice(2),
          ],
        )

        const params = [
          [
            0, //dextype: elastic
            tokenIn,
            amountIn,
            zapInfo,
            extraData,
            '0x',
          ],
          [validator, executor, deadline?.toString(), executorData, '0x'],
        ]

        const gasEstimated = await zapRouterContract.estimateGas[options.zapWithNative ? 'zapInWithNative' : 'zapIn'](
          ...params,
          {
            value: options.zapWithNative ? amountIn : undefined,
          },
        )

        if (options.estimateOnly) {
          return {
            gasEstimated,
            hash: '',
          }
        }
        const { hash } = await zapRouterContract[options.zapWithNative ? 'zapInWithNative' : 'zapIn'](...params, {
          value: options.zapWithNative ? amountIn : undefined,
          gasLimit: calculateGasMargin(gasEstimated),
        })
        return {
          gasEstimated,
          hash,
        }
      }

      return {
        gasEstimated: 0,
        hash: '',
      }
    },
    [account, deadline, executor, validator, posManagerAddress, zapRouterContract, slippage],
  )

  return {
    zapIn,
  }
}
