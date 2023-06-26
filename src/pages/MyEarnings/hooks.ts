import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { POOLS_BULK_WITH_PAGINATION, POOLS_HISTORICAL_BULK_WITH_PAGINATION, POOL_COUNT } from 'apollo/queries'
import { NETWORKS_INFO, ONLY_DYNAMIC_FEE_CHAINS, isEVM as isEVMChain } from 'constants/networks'
import { useETHPrice, useKyberSwapConfig } from 'state/application/hooks'
import { AppState } from 'state/index'
import { setError, setLoading, updatePools } from 'state/pools/actions'
import { get24hValue, getBlocksFromTimestamps, getPercentChange, getTimestampsForChanges } from 'utils'

export type ClassicPoolData = {
  id: string
  amp: string
  fee: number
  reserve0: string
  reserve1: string
  vReserve0: string
  vReserve1: string
  totalSupply: string
  reserveUSD: string
  volumeUSD: string
  feeUSD: string
  oneDayVolumeUSD: string
  oneDayVolumeUntracked: string
  oneDayFeeUSD: string
  oneDayFeeUntracked: string
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
          // TODO nguyenhuudungz: If number of pools > 1000 then uncomment this.
          // if (!oneDayHistory) {
          //   const newData = await apolloClient.query({
          //     query: POOL_DATA(pool.id, b1),
          //     fetchPolicy: 'network-only'
          //   })
          //   oneDayHistory = newData.data.pools[0]
          // }

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
  loading: AppState['pools']['loading']
  error: AppState['pools']['error']
  data: AppState['pools']['pools']
} {
  const dispatch = useDispatch()
  // const { chainId, isEVM, networkInfo } = useActiveWeb3React()
  const networkInfo = NETWORKS_INFO[chainId]
  const isEVM = isEVMChain(chainId)

  const poolsData = useSelector((state: AppState) => state.pools.pools)
  const loading = useSelector((state: AppState) => state.pools.loading)
  const error = useSelector((state: AppState) => state.pools.error)

  const { currentPrice: ethPrice } = useETHPrice()
  const { classicClient, blockClient, isEnableBlockService } = useKyberSwapConfig(chainId)

  const poolCountSubgraph = usePoolCountInSubgraph(chainId)
  useEffect(() => {
    if (!isEVM) return
    let cancelled = false

    const getPoolsData = async () => {
      try {
        if (poolCountSubgraph > 0 && poolsData.length === 0 && !error && ethPrice) {
          dispatch(setLoading(true))
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
                ethPrice,
                chainId,
              ),
            )
          }
          const pools = (await Promise.all(promises.map(callback => callback()))).flat()
          !cancelled && dispatch(updatePools({ pools }))
          !cancelled && dispatch(setLoading(false))
        }
      } catch (error) {
        !cancelled && dispatch(setError(error as Error))
        !cancelled && dispatch(setLoading(false))
      }
    }

    getPoolsData()

    return () => {
      cancelled = true
    }
  }, [
    chainId,
    dispatch,
    error,
    ethPrice,
    poolCountSubgraph,
    poolsData.length,
    isEVM,
    networkInfo,
    classicClient,
    blockClient,
    isEnableBlockService,
  ])

  return useMemo(() => ({ loading, error, data: poolsData }), [error, loading, poolsData])
}
