import { gql, useLazyQuery } from '@apollo/client'
import { CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { useEffect } from 'react'

import { ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { CommonProps } from '.'
import { setFarms, setLoading } from '..'
import { ElasticFarm } from '../types'

interface SubgraphToken {
  id: string
  name: string
  decimals: string
  symbol: string
}

interface FarmingPool {
  id: string
  pid: string
  startTime: string
  endTime: string
  feeTarget: string
  rewardTokens: Array<{
    token: SubgraphToken
    amount: string
  }>
  joinedPositions: Array<{
    id: string
    user: string
    pid: string
    liquidity: string
    position: {
      id: string
      liquidity: string
      tickLower: {
        tickIdx: string
      }
      tickUpper: {
        tickIdx: string
      }
    }
  }>
  pool: {
    id: string
    feeTier: string
    sqrtPrice: string
    feesUSD: string
    liquidity: string
    tick: string
    totalValueLockedUSD: string
    reinvestL: string
    token0: SubgraphToken
    token1: SubgraphToken
  }
}

interface SubgraphFarm {
  id: string
  farmingPools: Array<FarmingPool>
}

const ELASTIC_FARM_QUERY = gql`
  query getFarms {
    farms(first: 1000) {
      id
      farmingPools(
        orderBy: pid
        orderDirection: desc
        where: { pool_: { id_not: "0xf2057f0231bedcecf32436e3cd6b0b93c6675e0a" } }
      ) {
        id
        pid
        startTime
        endTime
        feeTarget
        rewardTokens(orderBy: priority, orderDirection: asc) {
          token {
            id
            symbol
            name
            decimals
          }
          priority
          amount
        }
        joinedPositions {
          id
          user
          pid
          liquidity
          position {
            id
            liquidity
            tickLower {
              tickIdx
            }
            tickUpper {
              tickIdx
            }
          }
        }
        pool {
          id
          feeTier
          tick
          totalValueLockedUSD
          liquidity
          feesUSD
          reinvestL
          sqrtPrice
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
        }
      }
    }
  }
`

const defaultChainData = {
  loading: false,
  farms: null,
  poolFeeLast24h: {},
}

const FarmUpdaterV1: React.FC<CommonProps> = ({ interval }) => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const elasticFarm = useAppSelector(state => state.elasticFarm)[chainId || 1] || defaultChainData
  const { elasticClient } = useKyberSwapConfig()

  const [getElasticFarms, { data, error }] = useLazyQuery(ELASTIC_FARM_QUERY, {
    client: elasticClient,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    const getFarm = (withLoading = false) => {
      withLoading && dispatch(setLoading({ chainId, loading: true }))
      try {
        getElasticFarms()
      } finally {
        withLoading && dispatch(setLoading({ chainId, loading: false }))
      }
    }
    getFarm(true)
    const i = interval
      ? setInterval(() => {
          getFarm()
        }, 20_000)
      : undefined
    return () => {
      i && clearInterval(i)
    }
  }, [interval, chainId, getElasticFarms, dispatch])

  useEffect(() => {
    if (error && chainId) {
      dispatch(setFarms({ chainId, farms: [] }))
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [error, dispatch, chainId])

  const hasFarm = elasticFarm?.farms?.length
  useEffect(() => {
    if (data?.farms && chainId && !hasFarm) {
      // transform farm data
      const formattedData: ElasticFarm[] = data.farms.map((farm: SubgraphFarm) => {
        return {
          id: farm.id,
          pools: farm.farmingPools.map(pool => {
            const token0Address = isAddressString(pool.pool.token0.id)
            const token1Address = isAddressString(pool.pool.token1.id)

            const token0 =
              token0Address === WETH[chainId].address
                ? NativeCurrencies[chainId]
                : new Token(
                    chainId,
                    token0Address,
                    Number(pool.pool.token0.decimals),
                    pool.pool.token0.symbol.toLowerCase() === 'mimatic' ? 'MAI' : pool.pool.token0.symbol,
                    pool.pool.token0.name,
                  )

            const token1 =
              token1Address === WETH[chainId].address
                ? NativeCurrencies[chainId]
                : new Token(
                    chainId,
                    token1Address,
                    Number(pool.pool.token1.decimals),
                    pool.pool.token1.symbol.toLowerCase() === 'mimatic' ? 'MAI' : pool.pool.token1.symbol,
                    pool.pool.token1.name,
                  )

            const p = new Pool(
              token0.wrapped,
              token1.wrapped,
              Number(pool.pool.feeTier) as FeeAmount,
              pool.pool.sqrtPrice,
              pool.pool.liquidity,
              pool.pool.reinvestL,
              Number(pool.pool.tick),
            )

            let tvlToken0 = TokenAmount.fromRawAmount(token0.wrapped, 0)
            let tvlToken1 = TokenAmount.fromRawAmount(token1.wrapped, 0)
            pool.joinedPositions.forEach(pos => {
              if (pos.position.liquidity !== '0') {
                const position = new Position({
                  pool: p,
                  liquidity: pos.liquidity,
                  tickLower: Number(pos.position.tickLower.tickIdx),
                  tickUpper: Number(pos.position.tickUpper.tickIdx),
                })
                tvlToken0 = tvlToken0.add(position.amount0)
                tvlToken1 = tvlToken1.add(position.amount1)
              }
            })

            return {
              startTime: Number(pool.startTime),
              endTime: Number(pool.endTime),
              pid: pool.pid,
              id: pool.id,
              feeTarget: pool.feeTarget,
              token0,
              token1,
              poolAddress: pool.pool.id,
              feesUSD: Number(pool.pool.feesUSD),
              pool: p,
              poolTvl: Number(pool.pool.totalValueLockedUSD),
              rewardTokens: pool.rewardTokens.map(({ token }) => {
                return token.id === ZERO_ADDRESS
                  ? NativeCurrencies[chainId]
                  : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
              }),
              totalRewards: pool.rewardTokens.map(({ token, amount }) => {
                const t =
                  token.id === ZERO_ADDRESS
                    ? NativeCurrencies[chainId]
                    : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
                return CurrencyAmount.fromRawAmount(t, amount)
              }),
              tvlToken0,
              tvlToken1,
            }
          }),
        }
      })
      dispatch(setFarms({ chainId, farms: formattedData }))
    }
  }, [data, dispatch, chainId, hasFarm])

  return null
}

export default FarmUpdaterV1
