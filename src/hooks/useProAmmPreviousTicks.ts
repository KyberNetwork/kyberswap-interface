import { ADDRESS_ZERO, computePoolAddress, Pool, TickMath } from '@vutien/dmm-v3-sdk'
import { PRO_AMM_CORE_FACTORY_ADDRESSES } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useProAmmTickReader } from './useContract'

export default function useProAmmPreviousTicks(
  pool: Pool | null | undefined,
  tickLower: number | undefined,
  tickUpper: number | undefined
): number[] | undefined {
  const tickReader = useProAmmTickReader()
  const { chainId } = useActiveWeb3React()

  const poolAddress = useMemo(() => {
    const proAmmCoreFactoryAddress = chainId && PRO_AMM_CORE_FACTORY_ADDRESSES[chainId]
    if (!!proAmmCoreFactoryAddress && !!pool)
      return computePoolAddress({
        factoryAddress: proAmmCoreFactoryAddress,
        tokenA: pool.token0,
        tokenB: pool.token1,
        fee: pool.fee
      })
    return ''
  }, [chainId])

  const results = useSingleContractMultipleData(
    tickReader,
    'getNearestInitializedTicks',
    [
      [poolAddress, tickLower],
      [poolAddress, tickUpper]
    ].filter(item => !!item[0] && !!item[1])
  )
  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])
  return useMemo(() => {
    if (!pool) return [TickMath.MIN_TICK, TickMath.MIN_TICK]
    if (!loading && !error && !!pool) {
      return results.map((call, i) => {
        const result = call.result as Result
        return result.previous
      })
    }
    return undefined
  }, [results, loading, error, pool])
}
