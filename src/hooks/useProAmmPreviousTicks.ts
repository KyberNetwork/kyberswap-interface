import { computePoolAddress, Pool, Position, TickMath } from '@vutien/dmm-v3-sdk'
import { PRO_AMM_CORE_FACTORY_ADDRESSES } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useProAmmTickReader } from './useContract'

const isNullOrUndefined = <T>(value: T) => value === null || value === undefined

export default function useProAmmPreviousTicks(
  pool: Pool | null | undefined,
  position: Position | undefined
): number[] | undefined {
  const tickReader = useProAmmTickReader()
  const { chainId } = useActiveWeb3React()

  const poolAddress = useMemo(() => {
    const proAmmCoreFactoryAddress = chainId && PRO_AMM_CORE_FACTORY_ADDRESSES[chainId]

    if (!!proAmmCoreFactoryAddress && !!position)
      return computePoolAddress({
        factoryAddress: proAmmCoreFactoryAddress,
        tokenA: position.pool.token0,
        tokenB: position.pool.token1,
        fee: position.pool.fee,
        initCodeHashManualOverride: '0xd71790a46dff0e075392efbd706356cd5a822a782f46e9859829440065879f81'
      })
    return ''
  }, [chainId, pool, position])

  const results = useSingleContractMultipleData(
    tickReader,
    'getNearestInitializedTicks',
    [
      [poolAddress, position?.tickLower],
      [poolAddress, position?.tickUpper]
    ].filter(item => !!pool && !isNullOrUndefined(item[0]) && !isNullOrUndefined(item[1]))
  )

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])
  return useMemo(() => {
    if (!pool) return [TickMath.MIN_TICK, TickMath.MIN_TICK]
    if (!loading && !error && !!pool) {
      return results.map(call => {
        const result = call.result as Result
        return result.previous
      })
    }
    return undefined
  }, [results, loading, error, pool])
}
