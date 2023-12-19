import { CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool } from '@kyberswap/ks-sdk-elastic'
import { useEffect } from 'react'
import knProtocolApi, { FarmingPool } from 'services/knprotocol'

import { ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch } from 'state/hooks'
import { isAddressString } from 'utils'

import { CommonProps } from '.'
import { setFarms, setLoading } from '..'
import { ElasticFarm } from '../types'

const FarmUpdaterV2: React.FC<CommonProps> = ({}) => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const { data: farms, isError, isLoading } = knProtocolApi.useGetFarmPoolsQuery(chainId)

  useEffect(() => {
    if (isLoading) {
      dispatch(setLoading({ chainId, loading: true }))
    } else {
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [chainId, dispatch, isLoading])

  useEffect(() => {
    if (isError && chainId) {
      dispatch(setFarms({ chainId, farms: [] }))
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [isError, dispatch, chainId])

  useEffect(() => {
    if (farms && chainId) {
      const poolsByFairLaunchContract: Record<
        string,
        {
          id: string
          pools: FarmingPool[]
        }
      > = {}
      farms.forEach(farmingPool => {
        const fairLaunchAddr = farmingPool.farm.id
        if (!poolsByFairLaunchContract[fairLaunchAddr]) {
          poolsByFairLaunchContract[fairLaunchAddr] = {
            id: fairLaunchAddr,
            pools: [],
          }
        }

        poolsByFairLaunchContract[fairLaunchAddr].pools.push(farmingPool)
      })

      const formattedPoolData: ElasticFarm[] = Object.values(poolsByFairLaunchContract).map(
        ({ id, pools: rawPools }) => {
          const pools = rawPools.map(rawPool => {
            const token0Address = isAddressString(rawPool.pool.token0.id)
            const token1Address = isAddressString(rawPool.pool.token1.id)

            const token0 =
              token0Address === WETH[chainId].address
                ? NativeCurrencies[chainId]
                : new Token(
                    chainId,
                    token0Address,
                    Number(rawPool.pool.token0.decimals),
                    rawPool.pool.token0.symbol.toLowerCase() === 'mimatic' ? 'MAI' : rawPool.pool.token0.symbol,
                    rawPool.pool.token0.name,
                  )

            const token1 =
              token1Address === WETH[chainId].address
                ? NativeCurrencies[chainId]
                : new Token(
                    chainId,
                    token1Address,
                    Number(rawPool.pool.token1.decimals),
                    rawPool.pool.token1.symbol.toLowerCase() === 'mimatic' ? 'MAI' : rawPool.pool.token1.symbol,
                    rawPool.pool.token1.name,
                  )

            const p = new Pool(
              token0.wrapped,
              token1.wrapped,
              Number(rawPool.pool.feeTier) as FeeAmount,
              rawPool.pool.sqrtPrice,
              rawPool.pool.liquidity,
              rawPool.pool.reinvestL,
              Number(rawPool.pool.tick),
            )

            const tvlToken0 = TokenAmount.fromRawAmount(token0.wrapped, 0)
            const tvlToken1 = TokenAmount.fromRawAmount(token1.wrapped, 0)

            return {
              startTime: Number(rawPool.startTime),
              endTime: Number(rawPool.endTime),
              pid: rawPool.pid,
              id: rawPool.id,
              feeTarget: rawPool.feeTarget,
              token0,
              token1,
              poolAddress: rawPool.pool.id,
              feesUSD: Number(rawPool.pool.feesUsd),
              pool: p,
              poolTvl: Number(rawPool.pool.totalValueLockedUsd),
              rewardTokens: rawPool.rewardTokens.map(token => {
                return token.id === ZERO_ADDRESS
                  ? NativeCurrencies[chainId]
                  : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
              }),
              totalRewards: rawPool.rewardTokens.map((token, i) => {
                const rewardAmount = rawPool.totalRewardAmounts[i]
                const t =
                  token.id === ZERO_ADDRESS
                    ? NativeCurrencies[chainId]
                    : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
                return CurrencyAmount.fromRawAmount(t, rewardAmount)
              }),
              tvlToken0,
              tvlToken1,
              apr: Number(rawPool.apr),
              poolAPR: Number(rawPool.pool.apr),
              stakedTvl: Number(rawPool.stakedTvl),
            }
          })

          // sort by pid
          // keep the same logic from v1
          pools.sort((pool1, pool2) => {
            if (pool1.pid === pool2.pid) {
              return 0
            }
            return pool1.pid < pool2.pid ? 1 : -1
          })

          return {
            id,
            pools,
          }
        },
      )

      dispatch(setFarms({ chainId, farms: formattedPoolData }))
    }
  }, [chainId, dispatch, farms])

  return null
}

export default FarmUpdaterV2
