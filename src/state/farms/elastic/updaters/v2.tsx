import { CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool } from '@kyberswap/ks-sdk-elastic'
import { useEffect } from 'react'
import useSWR from 'swr'

import { ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { nativeOnChain } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { CommonProps } from '.'
import { setFarms, setLoading } from '..'
import { ElasticFarm } from '../types'

interface SimpleToken {
  id: string
  name: string
  decimals: string
  symbol: string
}

interface FarmingPool {
  id: string
  vid: number
  block: number
  pid: string
  start_time: string
  end_time: string
  fee_target: string
  vesting_duration: string
  farm: string
  reward_tokens_ids: string[]
  total_reward_amounts: string[]
  pool: {
    id: string
    vid: number
    block: number
    created_at_timestamp: string
    created_at_block_number: string
    token_0: SimpleToken
    token_1: SimpleToken
    fee_tier: string
    liquidity: string
    reinvest_l: string
    reinvest_l_last: string
    sqrt_price: string
    total_supply: string
    fee_growth_global: string
    seconds_per_liquidity_global: string
    last_seconds_per_liquidity_data_update_time: string
    token_0_price: number
    token_1_price: number
    tick: string
    volume_token_0: number
    volume_token_1: number
    volume_usd: number
    untracked_volume_usd: number
    fees_usd: number
    tx_count: string
    collected_fees_token_0: number
    collected_fees_token_1: number
    collected_fees_usd: number
    total_value_locked_token_0: number
    total_value_locked_token_1: number
    total_value_locked_eth: number
    total_value_locked_usd: number
    total_value_locked_usd_untracked: number
    liquidity_provider_count: string
    position_count: string
    closed_position_count: string
    volume_usd_one_day_ago: number
    total_value_locked_usd_in_range: number
    apr: number
  }
  reward_tokens: SimpleToken[]
}

interface Response {
  code: number
  message: string
  data: {
    'farm-pools': FarmingPool[]
  }
}

const useGetElasticFarms = () => {
  const { chainId } = useActiveWeb3React()
  const chainRoute = chainId ? NETWORKS_INFO[chainId].route : ''

  // TODO: `chainRoute` may not be correct, update this when BE is available in other chains
  return useSWR<Response>(
    `${process.env.REACT_APP_POOL_FARM_BASE_URL}/${chainRoute}/api/v1/elastic/farm-pools`,
    (url: string) => fetch(url).then(resp => resp.json()),
    {
      refreshInterval: 15_000,
    },
  )
}

const defaultChainData = {
  loading: false,
  farms: null,
  poolFeeLast24h: {},
}

const FarmUpdaterV2: React.FC<CommonProps> = ({ interval }) => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const elasticFarm = useAppSelector(state => state.elasticFarm)[chainId || 1] || defaultChainData
  const { data, error, isValidating } = useGetElasticFarms()
  const farms = data?.data?.['farm-pools']

  useEffect(() => {
    if (!elasticFarm.farms) {
      if (isValidating) {
        console.time('getFarmFromBackend')
        dispatch(setLoading({ chainId, loading: true }))
      } else {
        console.timeEnd('getFarmFromBackend')
        dispatch(setLoading({ chainId, loading: false }))
      }
    }
  }, [chainId, dispatch, elasticFarm.farms, isValidating])

  useEffect(() => {
    if (error && chainId) {
      dispatch(setFarms({ chainId, farms: [] }))
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [error, dispatch, chainId])

  useEffect(() => {
    if (farms && chainId) {
      const poolsByFairLaunchContract: Record<string, FarmingPool[]> = {}
      farms.forEach(pool => {
        const fairLaunchAddr = pool.farm
        if (!poolsByFairLaunchContract[fairLaunchAddr]) {
          poolsByFairLaunchContract[fairLaunchAddr] = []
        }

        poolsByFairLaunchContract[fairLaunchAddr].push(pool)
      })

      const formattedPoolData: ElasticFarm[] = Object.values(poolsByFairLaunchContract).map(rawPools => {
        const id = rawPools[0].farm
        const rewardLocker = '' // TODO: insert this
        const pools = rawPools.map(pool => {
          const token0Address = isAddressString(pool.pool.token_0.id)
          const token1Address = isAddressString(pool.pool.token_1.id)

          const token0 =
            token0Address === WETH[chainId].address
              ? nativeOnChain(chainId)
              : new Token(
                  chainId,
                  token0Address,
                  Number(pool.pool.token_0.decimals),
                  pool.pool.token_0.symbol.toLowerCase() === 'mimatic' ? 'MAI' : pool.pool.token_0.symbol,
                  pool.pool.token_0.name,
                )

          const token1 =
            token1Address === WETH[chainId].address
              ? nativeOnChain(chainId)
              : new Token(
                  chainId,
                  token1Address,
                  Number(pool.pool.token_1.decimals),
                  pool.pool.token_1.symbol.toLowerCase() === 'mimatic' ? 'MAI' : pool.pool.token_1.symbol,
                  pool.pool.token_1.name,
                )

          const p = new Pool(
            token0.wrapped,
            token1.wrapped,
            Number(pool.pool.fee_tier) as FeeAmount,
            pool.pool.sqrt_price,
            pool.pool.liquidity,
            pool.pool.reinvest_l,
            Number(pool.pool.tick),
          )

          const tvlToken0 = TokenAmount.fromRawAmount(token0.wrapped, 0)
          const tvlToken1 = TokenAmount.fromRawAmount(token1.wrapped, 0)

          return {
            startTime: Number(pool.start_time),
            endTime: Number(pool.end_time),
            pid: pool.pid,
            id: pool.id,
            feeTarget: pool.fee_target,
            vestingDuration: Number(pool.vesting_duration),
            token0,
            token1,
            poolAddress: pool.pool.id,
            feesUSD: Number(pool.pool.fees_usd),
            pool: p,
            poolTvl: Number(pool.pool.total_value_locked_usd),
            rewardTokens: pool.reward_tokens.map(token => {
              return token.id === ZERO_ADDRESS
                ? nativeOnChain(chainId)
                : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
            }),
            totalRewards: pool.reward_tokens.map((token, i) => {
              const rewardAmount = pool.total_reward_amounts[i]
              const t =
                token.id === ZERO_ADDRESS
                  ? nativeOnChain(chainId)
                  : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
              return CurrencyAmount.fromRawAmount(t, rewardAmount)
            }),
            tvlToken0,
            tvlToken1,
          }
        })

        return {
          id,
          rewardLocker,
          pools,
        }
      })

      dispatch(setFarms({ chainId, farms: formattedPoolData }))
    }
  }, [chainId, dispatch, farms])

  return null
}

export default FarmUpdaterV2
