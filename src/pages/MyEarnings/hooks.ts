import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { ChainId, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { captureException } from '@sentry/react'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import { POOLS_BULK_WITH_PAGINATION, POOLS_HISTORICAL_BULK_WITH_PAGINATION, POOL_COUNT } from 'apollo/queries'
import { NETWORKS_INFO, ONLY_DYNAMIC_FEE_CHAINS, isEVM as isEVMChain } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { Position as SubgraphLegacyPosition, config, parsePosition } from 'hooks/useElasticLegacy'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { MODAL_PENDING_TEXTS } from 'pages/MyEarnings/constants'
import { useKyberSwapConfig } from 'state/application/hooks'
import { setAttemptingTxn, setShowPendingModal, setTxError, setTxnHash } from 'state/myEarnings/actions'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import {
  basisPointsToPercent,
  calculateGasMargin,
  get24hValue,
  getBlocksFromTimestamps,
  getPercentChange,
  getTimestampsForChanges,
} from 'utils'
import { ErrorName } from 'utils/sentry'
import { unwrappedToken } from 'utils/wrappedCurrency'

export type ClassicPoolData = {
  id: string
  amp: string
  apr: string
  farmApr: string
  fee: number
  reserve0: string
  reserve1: string
  vReserve0: string
  vReserve1: string
  totalSupply: string
  reserveUSD: string
  volumeUsd: string
  volumeUsdOneDayAgo: string
  volumeUsdTwoDaysAgo: string
  feeUSD: string
  feesUsdOneDayAgo: string
  feesUsdTwoDaysAgo: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
    totalLiquidity: string
    derivedETH: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
    totalLiquidity: string
    derivedETH: string
  }
}

function parseData(data: any, oneDayData: any, ethPrice: any, oneDayBlock: any, chainId?: ChainId): ClassicPoolData {
  // get volume changes
  const oneDayVolumeUSD = get24hValue(data?.volumeUSD, oneDayData?.volumeUSD)
  const oneDayFeeUSD = get24hValue(data?.feeUSD, oneDayData?.feeUSD)
  const oneDayVolumeUntracked = get24hValue(data?.untrackedVolumeUSD, oneDayData?.untrackedVolumeUSD)
  const oneDayFeeUntracked = get24hValue(data?.untrackedFeeUSD, oneDayData?.untrackedFeeUSD)

  // set volume properties
  data.oneDayVolumeUSD = oneDayVolumeUSD
  data.oneDayFeeUSD = oneDayFeeUSD
  data.oneDayFeeUntracked = oneDayFeeUntracked
  data.oneDayVolumeUntracked = oneDayVolumeUntracked

  // set liquiditry properties
  data.trackedReserveUSD = data.trackedReserveETH * ethPrice
  data.liquidityChangeUSD = getPercentChange(data.reserveUSD, oneDayData?.reserveUSD)

  // format if pool hasnt existed for a day or a week
  if (!oneDayData && data) {
    if (data.createdAtBlockNumber > oneDayBlock) data.oneDayVolumeUSD = parseFloat(data.volumeUSD)
    else data.oneDayVolumeUSD = 0
  }

  if (chainId && WETH[chainId].address.toLowerCase() === data?.token0?.id) {
    data.token0 = { ...data.token0, name: WETH[chainId].name, symbol: WETH[chainId].symbol }
  }
  if (chainId && WETH[chainId].address.toLowerCase() === data?.token1?.id) {
    data.token1 = { ...data.token1, name: WETH[chainId].name, symbol: WETH[chainId].symbol }
  }

  return data
}

async function getBulkPoolDataWithPagination(
  isEnableBlockService: boolean,
  first: number,
  skip: number,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  blockClient: ApolloClient<NormalizedCacheObject>,
  ethPrice: string,
  chainId: ChainId,
): Promise<any> {
  try {
    const [t1] = getTimestampsForChanges()
    const blocks = await getBlocksFromTimestamps(isEnableBlockService, blockClient, [t1], chainId)

    // In case we can't get the block one day ago then we set it to 0 which is fine
    // because our subgraph never syncs from block 0 => response is empty
    const [{ number: b1 }] = blocks.length ? blocks : [{ number: 0 }]
    const [oneDayResult, current] = await Promise.all(
      [b1]
        .map(async block => {
          const result = apolloClient
            .query({
              query: POOLS_HISTORICAL_BULK_WITH_PAGINATION(
                first,
                skip,
                block,
                chainId && !ONLY_DYNAMIC_FEE_CHAINS.includes(chainId),
              ),
              fetchPolicy: 'network-only',
            })
            .catch(err => {
              return err
            })
          return result
        })
        .concat(
          apolloClient.query({
            query: POOLS_BULK_WITH_PAGINATION(first, skip, chainId && !ONLY_DYNAMIC_FEE_CHAINS.includes(chainId)),
            fetchPolicy: 'network-only',
          }),
        ),
    )

    const oneDayData = oneDayResult?.data?.pools.reduce((obj: any, cur: any) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    const poolData = await Promise.all(
      current &&
        current.data.pools.map(async (pool: any) => {
          let data = { ...pool }
          const oneDayHistory = oneDayData?.[pool.id]
          data = parseData(data, oneDayHistory, ethPrice, b1, chainId)
          return data
        }),
    )

    return poolData
  } catch (e) {
    console.error(e)
    throw e
  }
}

function usePoolCountInSubgraph(chainId: ChainId): number {
  const [poolCount, setPoolCount] = useState(0)
  const isEVM = isEVMChain(chainId)
  const networkInfo = NETWORKS_INFO[chainId]
  const { classicClient } = useKyberSwapConfig(chainId)

  useEffect(() => {
    if (!isEVM) return
    const getPoolCount = async () => {
      const result = await classicClient.query({
        query: POOL_COUNT,
        fetchPolicy: 'network-only',
      })
      setPoolCount(
        result?.data.dmmFactories.reduce((count: number, factory: { poolCount: number }) => {
          return count + factory.poolCount
        }, 0) || 0,
      )
    }

    getPoolCount()
  }, [networkInfo, isEVM, classicClient])

  return poolCount
}

export function useAllPoolsData(chainId: ChainId): {
  isLoading: boolean
  error: Error | undefined
  data: ClassicPoolData[]
} {
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [data, setData] = useState<ClassicPoolData[]>([])

  const wrappedNativeTokenAddress = WETH[chainId].wrapped.address
  const isEVM = isEVMChain(chainId)

  const { data: tokenPrices } = useTokenPricesWithLoading([wrappedNativeTokenAddress], chainId)
  const ethPrice = tokenPrices?.[wrappedNativeTokenAddress]
  const { classicClient, blockClient, isEnableBlockService } = useKyberSwapConfig(chainId)

  const poolCountSubgraph = usePoolCountInSubgraph(chainId)
  useEffect(() => {
    if (!isEVM) return
    const controller = new AbortController()

    const getPoolsData = async () => {
      try {
        if (poolCountSubgraph > 0 && data.length === 0 && !error && ethPrice) {
          setLoading(true)
          const ITEM_PER_CHUNK = Math.min(1000, poolCountSubgraph) // GraphNode can handle max 1000 records per query.
          const promises = []
          for (let i = 0, j = poolCountSubgraph; i < j; i += ITEM_PER_CHUNK) {
            promises.push(() =>
              getBulkPoolDataWithPagination(
                isEnableBlockService,
                ITEM_PER_CHUNK,
                i,
                classicClient,
                blockClient,
                String(ethPrice),
                chainId,
              ),
            )
          }
          const pools = (await Promise.all(promises.map(callback => callback()))).flat()

          if (controller.signal.aborted) return
          setData(pools)
          setLoading(false)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setError(error as Error)
        setLoading(false)
      }
    }

    getPoolsData()

    return () => {
      controller.abort()
    }
  }, [
    blockClient,
    chainId,
    classicClient,
    data?.length,
    error,
    ethPrice,
    isEVM,
    isEnableBlockService,
    poolCountSubgraph,
  ])

  return useMemo(() => ({ isLoading, error, data }), [data, error, isLoading])
}

export function useRemoveLiquidityFromLegacyPosition(
  subgraphPosition: SubgraphLegacyPosition,
  tokenPrices: Record<string, number>,
  feeRewards: [string, string],
) {
  const { chainId, account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const dispatch = useDispatch()
  const collectFee = true
  const libraryRef = useRef(library)
  libraryRef.current = library

  const { token0, token1, position } = parsePosition(subgraphPosition, chainId, tokenPrices)
  const feeValue0 = CurrencyAmount.fromRawAmount(unwrappedToken(token0), feeRewards[0])
  const feeValue1 = CurrencyAmount.fromRawAmount(unwrappedToken(token1), feeRewards[1])

  const [allowedSlippage] = useUserSlippageTolerance()
  const deadline = useTransactionDeadline()

  const addTransactionWithType = useTransactionAdder()

  const removeLiquidity = () => {
    dispatch(setShowPendingModal(MODAL_PENDING_TEXTS.REMOVE_LIQUIDITY))
    dispatch(setAttemptingTxn(true))

    const library = libraryRef.current
    if (!library) {
      return
    }

    if (!deadline || !account || !library) {
      dispatch(setTxError('Something went wrong!'))
      return
    }
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
      tokenId: subgraphPosition.id,
      liquidityPercentage: new Percent('100', '100'),
      slippageTolerance: basisPointsToPercent(allowedSlippage),
      deadline: deadline.toString(),
      collectOptions: {
        expectedCurrencyOwed0: collectFee
          ? feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage)))
          : CurrencyAmount.fromRawAmount(feeValue0.currency, 0),
        expectedCurrencyOwed1: collectFee
          ? feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage)))
          : CurrencyAmount.fromRawAmount(feeValue1.currency, 0),
        recipient: account,
        deadline: deadline.toString(),
        isRemovingLiquid: true,
        havingFee: collectFee && !(feeValue0.equalTo(JSBI.BigInt('0')) && feeValue1.equalTo(JSBI.BigInt('0'))),
      },
    })

    const txn = {
      to: config[chainId].positionManagerContract,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then(async (estimate: BigNumber) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            const tokenAmountIn = position.amount0.toSignificant(6)
            const tokenAmountOut = position.amount1.toSignificant(6)
            const tokenSymbolIn = token0.symbol
            const tokenSymbolOut = token1.symbol

            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
              extraInfo: {
                tokenAmountIn,
                tokenAmountOut,
                tokenSymbolIn,
                tokenSymbolOut,
                tokenAddressIn: token0.wrapped.address,
                tokenAddressOut: token1.wrapped.address,
                contract: subgraphPosition.pool.id,
                nftId: subgraphPosition.id,
              },
            })
            dispatch(setAttemptingTxn(false))
            dispatch(setTxnHash(response.hash))
          })
      })
      .catch((error: any) => {
        dispatch(setShowPendingModal(MODAL_PENDING_TEXTS.REMOVE_LIQUIDITY))
        dispatch(setAttemptingTxn(false))

        if (error?.code !== 'ACTION_REJECTED') {
          const e = new Error('Remove Legacy Elastic Liquidity Error', { cause: error })
          e.name = ErrorName.RemoveElasticLiquidityError
          captureException(e, {
            extra: {
              calldata,
              value,
              to: config[chainId].positionManagerContract,
            },
          })
        }

        dispatch(setTxError(error?.message || JSON.stringify(error)))
      })
  }

  return removeLiquidity
}
