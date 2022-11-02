import { ChainId } from '@kyberswap/ks-sdk-core'
import useSWRImmutable from 'swr/immutable'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { ElasticPoolDetail } from 'types/pool'

import { CommonReturn } from '.'

export type RawToken = {
  id: string
  symbol: string
  name: string
  decimals: string
}

export type ElasticPool = {
  id: string

  token0: RawToken
  token1: RawToken

  feeTier: string
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: string

  volumeUsd: number
  feesUsd: number

  totalValueLockedUsd: number
  feesUsdOneDayAgo: number
  volumeUsdOneDayAgo: number

  totalValueLockedUsdInRange: number
  apr: number
  farmApr: number
}

type Response = {
  code: number
  message: string
  data?: {
    pools: Array<ElasticPool>
  }
}

type PoolAccumulator = { [address: string]: ElasticPoolDetail }

const useGetElasticPoolsV2 = (): CommonReturn => {
  const { chainId } = useActiveWeb3React()

  if (chainId !== ChainId.OPTIMISM) {
    console.error('Only Optimism is supported')
  }

  const chainRoute = NETWORKS_INFO[chainId || ChainId.MAINNET].route

  const { isValidating, error, data } = useSWRImmutable<Response>(
    `${process.env.REACT_APP_POOL_FARM_BASE_URL}/${chainRoute}/api/v1/elastic/pools?includeLowTvl=true&page=1&perPage=10000`,
    (url: string) => fetch(url).then(resp => resp.json()),
    {
      refreshInterval: 60_000,
    },
  )

  const poolData: PoolAccumulator =
    data?.data?.pools.reduce((acc, pool) => {
      acc[pool.id] = {
        address: pool.id,

        token0: {
          address: pool.token0.id,
          name: pool.token0.name,
          symbol: pool.token0.symbol,
          decimals: parseInt(pool.token0.decimals),
        },
        token1: {
          address: pool.token1.id,
          name: pool.token1.name,
          symbol: pool.token1.symbol,
          decimals: parseInt(pool.token1.decimals),
        },

        feeTier: Number(pool.feeTier),

        volumeUSDLast24h: pool.volumeUsd - pool.volumeUsdOneDayAgo,

        tvlUSD: pool.totalValueLockedUsd,
        tvlUSDLast24h: pool.totalValueLockedUsd,
        apr: pool.apr,
        farmAPR: pool.farmApr,

        liquidity: pool.liquidity,
        sqrtPrice: pool.sqrtPrice,
        reinvestL: pool.reinvestL,
        tick: Number(pool.tick),

        // TODO: do we need this?
        token0Price: 0,
        token1Price: 0,
        tvlToken0: 0,
        tvlToken1: 0,
      }

      return acc
    }, {} as PoolAccumulator) || {}

  return {
    isLoading: isValidating,
    isError: !!error,
    data: poolData,
  }
}

export default useGetElasticPoolsV2
