import { Currency, CurrencyAmount, Percent } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { Interface, defaultAbiCoder as abiEncoder } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBuildRouteMutation, useLazyGetRouteQuery } from 'services/route'
import { RouteSummary } from 'services/route/types/getRoute'

import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import ZAP_ROUTER_ABI from 'constants/abis/elastic-zap/router.json'
import ZAP_HELPER_ABI from 'constants/abis/elastic-zap/zap-helper.json'
import { AGGREGATOR_API_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useReadingContract, useSigningContract } from 'hooks/useContract'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { useAggregatorForZapSetting, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin } from 'utils'

export interface ZapResult {
  liquidity: BigNumber
  usedAmount0: BigNumber
  usedAmount1: BigNumber
  remainingAmount0: BigNumber
  remainingAmount1: BigNumber
  currentTick: number
  sqrtP: BigNumber
  baseL: BigNumber
  reinvestL: BigNumber
}

const zapRouterInterface = new Interface(ZAP_ROUTER_ABI)

export function useZapInPoolResult(params?: {
  poolAddress: string
  tokenIn: string
  tokenOut: string
  amountIn: CurrencyAmount<Currency>
  tickLower: number
  tickUpper: number
}): {
  loading: boolean
  aggregatorData: RouteSummary | null
  result: ZapResult | undefined
} {
  const { networkInfo, chainId } = useActiveWeb3React()
  const zapHelperContract = useReadingContract(networkInfo.elastic.zap?.helper, ZAP_HELPER_ABI)

  const [useAggregatorForZap] = useAggregatorForZapSetting()

  const [loadingAggregator, setLoadingAggregator] = useState(false)
  const [getRoute] = useLazyGetRouteQuery()
  const [slippage] = useUserSlippageTolerance()

  const { aggregatorDomain } = useKyberswapGlobalConfig()
  const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}${AGGREGATOR_API_PATHS.GET_ROUTE}`

  const splitedAmount = useMemo(() => {
    if (!params?.amountIn) return []
    const percent = [10, 20, 30, 40, 50, 60, 70, 80, 90]
    const percents = percent.map(item => new Percent(item, 100))
    return percents.map(item => params.amountIn.multiply(item))
  }, [params?.amountIn])

  const [aggregatorOutputs, setAggregatorOutputs] = useState<Array<RouteSummary>>([])

  const { tokenIn, tokenOut, poolAddress } = params || {}

  const getRoutes = useCallback(() => {
    if (slippage) {
      // added to refresh rate when slippage change, aggregator dont need this
    }
    if (tokenIn && tokenOut && poolAddress) {
      setAggregatorOutputs([])
      if (useAggregatorForZap) {
        setLoadingAggregator(true)

        Promise.all(
          splitedAmount.map(item => {
            return getRoute({
              url,
              authentication: false,
              params: {
                tokenIn,
                tokenOut,
                amountIn: item.quotient.toString(),
                excludedPools: poolAddress,
                gasInclude: 'true',
              },
              clientId: 'kyberswap-zap',
            })
          }),
        )
          .then(res => res?.map(item => item?.data?.data?.routeSummary) || [])
          .then(res => setAggregatorOutputs(res.filter(Boolean) as Array<RouteSummary>))
          .finally(() => {
            setTimeout(() => setLoadingAggregator(false), 100)
          })
      }
    }
  }, [tokenIn, tokenOut, poolAddress, splitedAmount, getRoute, url, useAggregatorForZap, slippage])

  useEffect(() => {
    getRoutes()
    const i = setInterval(() => {
      getRoutes()
    }, 10_000)
    return () => i && clearInterval(i)
  }, [getRoutes])

  const callParams = useMemo(
    () =>
      params && !loadingAggregator && params.tickLower < params.tickUpper
        ? [
            [
              params.poolAddress,
              params.tokenIn,
              params.amountIn.quotient.toString(),
              '0',
              1,
              params.tickLower,
              params.tickUpper,
            ],
            ...aggregatorOutputs
              .filter(item => JSBI.greaterThan(params.amountIn.quotient, JSBI.BigInt(item.amountIn)))
              .map(item => [
                params.poolAddress,
                params.tokenIn,
                JSBI.subtract(params.amountIn.quotient, JSBI.BigInt(item.amountIn)).toString(),
                item.amountOut,
                1,
                params.tickLower,
                params.tickUpper,
              ]),
          ]
        : undefined,
    [params, aggregatorOutputs, loadingAggregator],
  )

  const data = useSingleContractMultipleData(
    params ? zapHelperContract : undefined,
    'getZapInPoolResults',
    callParams || [],
  )

  const bestRes = useMemo(() => {
    let index = -1
    let res = undefined
    let maxLiq = BigNumber.from('0')
    data.forEach((item, idx) => {
      const l = BigNumber.from(item?.result?.results?.liquidity?.toString() || '0')
      if (l.gt(maxLiq)) {
        maxLiq = l
        index = idx
        res = item?.result?.results
      }
    })

    return {
      result: res,
      loading: data?.some(item => item?.loading) || loadingAggregator,
      // index = 0 => dont need to use aggregator
      aggregatorData:
        index === 0 || !params
          ? null
          : aggregatorOutputs?.filter(item => JSBI.greaterThan(params.amountIn.quotient, JSBI.BigInt(item.amountIn)))?.[
              index - 1
            ],
    }
  }, [data, loadingAggregator, aggregatorOutputs, params])

  console.debug('Zap: best return from zap helper ', bestRes)
  return bestRes
}

export function useZapInAction() {
  const { networkInfo, account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { router: zapRouterAddress, validator, executor } = networkInfo.elastic?.zap || {}
  const zapRouterContract = useSigningContract(zapRouterAddress, ZAP_ROUTER_ABI)

  const posManagerAddress = networkInfo.elastic.nonfungiblePositionManager
  const [slippage] = useUserSlippageTolerance()
  const deadline = useTransactionDeadline() // custom from users settings

  const [useAggregatorForZap] = useAggregatorForZapSetting()
  const [buildRoute] = useBuildRouteMutation()

  const { aggregatorDomain } = useKyberswapGlobalConfig()
  const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}${AGGREGATOR_API_PATHS.BUILD_ROUTE}`

  const zapIn = useCallback(
    async (
      {
        tokenId = 0,
        tokenIn,
        amountIn,
        equivalentQuoteAmount,
        poolAddress,
        tickUpper,
        tickLower,
        poolInfo,
        tickPrevious,
        liquidity,
        aggregatorRoute,
      }: {
        tokenId?: number | string
        tokenIn: string
        amountIn: string
        equivalentQuoteAmount: string
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
        aggregatorRoute: RouteSummary | null
      },
      options: {
        zapWithNative: boolean
        estimateOnly?: boolean
      },
    ) => {
      if (zapRouterContract && account && library && executor) {
        let aggregatorRes = null
        if (aggregatorRoute && useAggregatorForZap) {
          aggregatorRes = (await buildRoute({
            url,
            payload: {
              routeSummary: aggregatorRoute,
              deadline: +(deadline?.toString() || (Math.floor(Date.now() / 1000) + 1200).toString()),
              slippageTolerance: slippage,
              sender: account,
              recipient: executor,
              source: 'kyberswap-zap',
              skipSimulateTx: false,
            },
            authentication: false,
          })) as { data: BuildRouteResult }
        }

        const minLiquidity = JSBI.divide(
          JSBI.multiply(JSBI.BigInt(liquidity), JSBI.BigInt(10000 - slippage)),
          JSBI.BigInt(10000),
        ).toString()

        const zapInfo = abiEncoder.encode(['address', 'address', 'uint256'], [poolAddress, posManagerAddress, tokenId])
        const extraData = tokenId
          ? abiEncoder.encode(['uint128'], [minLiquidity])
          : abiEncoder.encode(['address', 'int24', 'int24', 'uint128'], [account, tickLower, tickUpper, minLiquidity])

        const zeros = '0'.repeat(128)

        // max(1, 0.00001% * amount)
        const exp6 = JSBI.BigInt(1_000_000)
        const minZapAmount0 = JSBI.divide(
          JSBI.multiply(JSBI.greaterThan(JSBI.BigInt(amountIn), exp6) ? JSBI.BigInt(amountIn) : exp6, JSBI.BigInt(1)),
          exp6,
        ).toString(2)

        const minZapAmount1 = JSBI.divide(
          JSBI.multiply(
            JSBI.greaterThan(JSBI.BigInt(equivalentQuoteAmount), exp6) ? JSBI.BigInt(equivalentQuoteAmount) : exp6,
            JSBI.BigInt(1),
          ),
          exp6,
        ).toString(2)

        const minZapAmounts = BigInt(
          '0b' + (zeros + minZapAmount0).slice(-128) + (zeros + minZapAmount1).slice(-128),
        ).toString()
        const minRefundAmounts = minZapAmounts

        const zapExecutorData = abiEncoder.encode(
          [
            'address',
            'address',
            'tupple(address token0,int24 fee,address token1)',
            'uint256',
            'address',
            'uint256',
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
            minZapAmounts,
            minRefundAmounts,
            tickLower,
            tickUpper,
            tickPrevious,
            minLiquidity,
            '0x',
          ],
        )

        let aggregatorInfo = '0x'
        if (aggregatorRes?.data?.data) {
          aggregatorInfo =
            '0x0000000000000000000000000000000000000000000000000000000000000020' +
            abiEncoder
              .encode(
                ['address', 'uint256', 'bytes'],
                [aggregatorRes.data.data.routerAddress, aggregatorRes.data.data.amountIn, aggregatorRes.data.data.data],
              )
              .slice(2)
        }

        const executorData = abiEncoder.encode(
          ['uint8', 'address', 'uint256', 'bytes', 'bytes', 'bytes'],
          [
            0,
            tokenIn,
            amountIn,
            '0x', // feeInfo
            aggregatorInfo,
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

        const callData = zapRouterInterface.encodeFunctionData(
          options.zapWithNative ? 'zapInWithNative' : 'zapIn',
          params,
        )

        console.debug('zap data', {
          value: options.zapWithNative ? amountIn : undefined,
          data: callData,
          to: zapRouterAddress,
          minRefundAmounts,
        })

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

        const txn = {
          value: options.zapWithNative ? amountIn : undefined,
          data: callData,
          to: zapRouterAddress,
          gasLimit: calculateGasMargin(gasEstimated),
        }

        const { hash } = await library.getSigner().sendTransaction(txn)

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
    [
      account,
      deadline,
      executor,
      validator,
      posManagerAddress,
      zapRouterContract,
      slippage,
      buildRoute,
      useAggregatorForZap,
      url,
      library,
      zapRouterAddress,
    ],
  )

  return {
    zapIn,
  }
}
